const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class CertificateService {
  constructor() {
  this.templatePath = path.join(__dirname, '../../templates/certificate-template.html');
  this.winnerTemplatePath = path.join(__dirname, '../../templates/winner-certificate-template.html');
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
  generateCertificateUID(eventId, studentId) {
    return `STAIRS-CERT-${eventId}-${studentId}`;
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
      studentId, // Now expects database ID
      eventId, // Now expects database ID
      studentUniqueId, // Custom UID for display
      eventUniqueId, // Custom UID for display
      orderId
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
      const uid = this.generateCertificateUID(eventUniqueId, studentUniqueId);

      // Read template
      let htmlTemplate = await fs.readFile(this.templatePath, 'utf8');

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
      
      htmlTemplate = htmlTemplate
        .replace(/\[PARTICIPANT_NAME\]/g, participantName)
        .replace(/\[SPORT_NAME\]/g, sportName)
        .replace(/\[EVENT_NAME\]/g, eventName)
        .replace(/\[EVENT_DATE\]/g, eventDate || date)
        .replace(/\[ISSUE_DATE\]/g, issueDate)
        .replace(/\[DATE\]/g, date)
        .replace(/\[UID\]/g, uid)
        .replace(/\[LOGO_PATH\]/g, logoBase64);

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

      // Generate PDF filename
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
          uniqueId: uid
        }
      });

      console.log(`✅ Certificate generated successfully: ${uid}`);
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
   * Generate winner certificate for a single athlete with position
   */
  async generateWinnerCertificate(data) {
    const {
      participantName,
      sportName,
      eventName,
      date,
      eventDate,
      studentId,
      eventId,
      studentUniqueId,
      eventUniqueId,
      orderId,
      position, // 1, 2, 3, etc.
      positionText // "Winner", "Runner-Up", "Second Runner-Up", etc.
    } = data;

    try {
      await this.ensureCertificatesDirectory();

      const studentDbId = studentId;
      const eventDbId = eventId;

      if (!eventUniqueId) {
        throw new Error(`eventUniqueId is required but got: ${eventUniqueId}`);
      }
      if (!studentUniqueId) {
        throw new Error(`studentUniqueId is required but got: ${studentUniqueId}`);
      }
      if (!position) {
        throw new Error(`position is required for winner certificate`);
      }

      // Generate unique UID for winner certificate
      const uid = `STAIRS-WINNER-${eventUniqueId}-${studentUniqueId}-POS${position}`;

      // Read winner template
      let htmlTemplate = await fs.readFile(this.winnerTemplatePath, 'utf8');

      // Read logo as base64
      let logoBase64 = '';
      try {
        const logoBuffer = await fs.readFile(this.logoPath);
        const ext = this.logoPath.endsWith('.png') ? 'png' : 'jpeg';
        logoBase64 = `data:image/${ext};base64,${logoBuffer.toString('base64')}`;
      } catch (e) {
        console.error('❌ Error reading logo file:', e);
      }

      // Determine position badge and text
      let positionBadge = '';
      if (position === 1) positionBadge = '🥇 FIRST PLACE';
      else if (position === 2) positionBadge = '🥈 SECOND PLACE';
      else if (position === 3) positionBadge = '🥉 THIRD PLACE';
      else positionBadge = `POSITION ${position}`;

      const positionDisplay = position === 1 ? '1st' : position === 2 ? '2nd' : position === 3 ? '3rd' : `${position}th`;
      const finalPositionText = positionText || (position === 1 ? 'Winner' : position === 2 ? 'Runner-Up' : position === 3 ? 'Second Runner-Up' : `Position ${position}`);

      const issueDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      htmlTemplate = htmlTemplate
        .replace(/\[PARTICIPANT_NAME\]/g, participantName)
        .replace(/\[SPORT_NAME\]/g, sportName)
        .replace(/\[EVENT_NAME\]/g, eventName)
        .replace(/\[EVENT_DATE\]/g, eventDate || date)
        .replace(/\[ISSUE_DATE\]/g, issueDate)
        .replace(/\[DATE\]/g, date)
        .replace(/\[UID\]/g, uid)
        .replace(/\[LOGO_PATH\]/g, logoBase64)
        .replace(/\[POSITION_BADGE\]/g, positionBadge)
        .replace(/\[POSITION_NUMBER\]/g, positionDisplay)
        .replace(/\[POSITION_TEXT\]/g, finalPositionText);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });

      const page = await browser.newPage();
      
      await page.setContent(htmlTemplate, { 
        waitUntil: ['networkidle0', 'load', 'domcontentloaded'] 
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const filename = `${uid}.pdf`;
      const filepath = path.join(this.certificatesDir, filename);
      
      const htmlFilename = `${uid}.html`;
      const htmlFilepath = path.join(this.certificatesDir, htmlFilename);
      await fs.writeFile(htmlFilepath, htmlTemplate);

      await page.pdf({
        path: filepath,
        width: '1123px',
        height: '794px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: false
      });

      await browser.close();

      // Save certificate record
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
          uniqueId: uid
        }
      });

      console.log(`✅ Winner certificate generated successfully: ${uid} (Position ${position})`);
      return certificate;

    } catch (error) {
      console.error('❌ Error generating winner certificate:', error);
      throw error;
    }
  }

  /**
   * Generate bulk winner certificates
   */
  async generateBulkWinnerCertificates(certificatesData) {
    const results = [];
    const errors = [];

    for (const data of certificatesData) {
      try {
        const certificate = await this.generateWinnerCertificate(data);
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
}

module.exports = new CertificateService();
