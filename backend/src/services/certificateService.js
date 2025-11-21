const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CertificateService {
  constructor() {
    // Two templates: participation and winning
    this.participationTemplatePath = path.join(__dirname, '../../templates/certificate-template.html');
    this.winningTemplatePath = path.join(__dirname, '../../templates/winning-certificate-template.html');
    this.certificatesDir = path.join(__dirname, '../../uploads/certificates');
    
    // Prefer PNG if available, else JPG
    const pngPath = path.join(__dirname, '../../../assets/logo.png');
    const jpgPath = path.join(__dirname, '../../../assets/logo.jpg');
    this.logoPath = require('fs').existsSync(pngPath) ? pngPath : jpgPath;
  }

  /**
   * Ensure certificates directory exists
   */
  async ensureCertificatesDirectory() {
    try {
      await fs.access(this.certificatesDir);
    } catch {
      await fs.mkdir(this.certificatesDir, { recursive: true });
    }
  }

  /**
   * Generate a unique certificate UID
   */
  generateCertificateUID(eventId, studentId, certificateType = 'participation') {
    const typePrefix = certificateType === 'winning' ? 'WIN' : 'PART';
    return `STAIRS-CERT-${typePrefix}-${eventId}-${studentId}`;
  }

  /**
   * Get template path based on certificate type
   */
  getTemplatePath(certificateType) {
    if (certificateType === 'winning') {
      return this.winningTemplatePath;
    }
    return this.participationTemplatePath;
  }

  /**
   * Generate certificate for a single athlete
   */
  async generateCertificate(data) {
    const {
      participantName,
      sportName,
      eventName,
      date,
      eventDate,
      studentId, // Database ID
      eventId, // Database ID
      studentUniqueId, // Custom UID for display
      eventUniqueId, // Custom UID for display
      orderId,
      certificateType = 'participation', // NEW: 'participation' or 'winning'
      position, // NEW: Optional - for winning certificates (1st, 2nd, 3rd, etc.)
      achievement // NEW: Optional - custom achievement text
    } = data;

    try {
      await this.ensureCertificatesDirectory();

      // Use database IDs directly (passed from route)
      const studentDbId = studentId;
      const eventDbId = eventId;

      // CRITICAL: Validate that UIDs are not null
      if (!eventUniqueId) {
        throw new Error(`eventUniqueId is required but got: ${eventUniqueId}`);
      }
      if (!studentUniqueId) {
        throw new Error(`studentUniqueId is required but got: ${studentUniqueId}`);
      }

      // Generate unique UID for certificate using custom formatted UIDs
      const uid = this.generateCertificateUID(eventUniqueId, studentUniqueId, certificateType);

      // Get appropriate template based on certificate type
      const templatePath = this.getTemplatePath(certificateType);
      
      // Check if template exists, fallback to participation template if winning doesn't exist
      let htmlTemplate;
      try {
        htmlTemplate = await fs.readFile(templatePath, 'utf8');
      } catch (error) {
        console.warn(`⚠️ Template not found: ${templatePath}, using participation template`);
        htmlTemplate = await fs.readFile(this.participationTemplatePath, 'utf8');
      }

      // Read logo as base64
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(this.logoPath);
        const ext = this.logoPath.endsWith('.png') ? 'png' : 'jpeg';
        logoBase64 = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
        console.log(`Logo base64 length: ${logoBase64.length}`);
      } catch (e) {
        console.error('❌ Error reading logo file:', e);
      }

      // Replace placeholders with actual data
      const issueDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Determine achievement text based on position or custom achievement
      let achievementText = 'for outstanding performance';
      if (position) {
        const positionSuffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
        achievementText = `for securing ${position}${positionSuffix} position`;
      } else if (achievement) {
        achievementText = achievement;
      }
      
      htmlTemplate = htmlTemplate
        .replace(/\[PARTICIPANT_NAME\]/g, participantName)
        .replace(/\[SPORT_NAME\]/g, sportName)
        .replace(/\[EVENT_NAME\]/g, eventName)
        .replace(/\[EVENT_DATE\]/g, eventDate || date)
        .replace(/\[ISSUE_DATE\]/g, issueDate)
        .replace(/\[DATE\]/g, date)
        .replace(/\[UID\]/g, uid)
        .replace(/\[LOGO_PATH\]/g, logoBase64)
        .replace(/\[ACHIEVEMENT\]/g, achievementText)
        .replace(/\[POSITION\]/g, position ? `${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} Place` : '');

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });

      const page = await browser.newPage();
      
      // Set content and wait for all resources including images
      await page.setContent(htmlTemplate, { 
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'] 
      });

      // Wait extra time for base64 images to render using setTimeout
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if image loaded
      const imageLoaded = await page.evaluate(() => {
        const img = document.querySelector('.institute-logo');
        return img && img.complete && img.naturalHeight !== 0;
      });

      console.log(`📸 Image loaded status: ${imageLoaded}`);

      // Generate PDF filename with certificate type
      const typePrefix = certificateType === 'winning' ? 'winning' : 'participation';
      const filename = `${uid}.pdf`;
      const filepath = path.join(this.certificatesDir, filename);
      
      // Also save HTML version for backup/debugging
      const htmlFilename = `${uid}.html`;
      const htmlFilepath = path.join(this.certificatesDir, htmlFilename);
      await fs.writeFile(htmlFilepath, htmlTemplate);
      console.log(`📄 HTML version saved: ${htmlFilename}`);

      // Generate PDF with optimized settings for images
      await page.pdf({
        path: filepath,
        width: '1123px',
        height: '794px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false
      });

      await browser.close();

      // Save certificate record to database using database IDs
      const certificate = await prisma.certificate.create({
        data: {
          studentId: studentDbId,
          eventId: eventDbId,
          orderId,
          certificateUrl: `/uploads/certificates/${filename}`,
          participantName,
          sportName,
          eventName,
          issueDate: new Date(date),
          uniqueId: uid,
          certificateType: certificateType, // NEW: Store certificate type
          position: position || null, // NEW: Store position if provided
          achievement: achievement || null // NEW: Store custom achievement
        }
      });

      console.log(`✅ ${certificateType === 'winning' ? 'Winning' : 'Participation'} certificate generated successfully: ${uid}`);
      return certificate;

    } catch (error) {
      console.error('❌ Error generating certificate:', error);
      throw error;
    }
  }

  /**
   * Generate certificates for multiple athletes
   */
  async generateBulkCertificates(certificatesData) {
    const results = [];
    const errors = [];

    for (const data of certificatesData) {
      try {
        const certificate = await this.generateCertificate(data);
        results.push(certificate);
      } catch (error) {
        errors.push({
          studentId: data.studentId,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  /**
   * Get certificates for an athlete
   */
  async getStudentCertificates(studentId) {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { studentId },
        orderBy: { issueDate: 'desc' }
      });
      return certificates;
    } catch (error) {
      console.error('❌ Error fetching student certificates:', error);
      throw error;
    }
  }

  /**
   * Get certificate by UID
   */
  async getCertificateByUID(uid) {
    try {
      const certificate = await prisma.certificate.findUnique({
        where: { uniqueId: uid }
      });
      return certificate;
    } catch (error) {
      console.error('❌ Error fetching certificate by UID:', error);
      throw error;
    }
  }

  /**
   * Get certificates by type for an event
   */
  async getEventCertificatesByType(eventId, certificateType) {
    try {
      const certificates = await prisma.certificate.findMany({
        where: { 
          eventId,
          certificateType 
        },
        orderBy: { issueDate: 'desc' }
      });
      return certificates;
    } catch (error) {
      console.error('❌ Error fetching event certificates by type:', error);
      throw error;
    }
  }
}

module.exports = new CertificateService();