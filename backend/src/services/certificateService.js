const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const prisma = require('../prisma/schema');

class CertificateService {
  constructor() {
    this.templatePath = path.join(__dirname, '../../templates/certificate-template.html');
    this.certificatesDir = path.join(__dirname, '../../../uploads/certificates');
    this.logoPath = path.join(__dirname, '../../../assets/logo.png');
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
  generateCertificateUID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `STAIRS-CERT-${timestamp}-${random}`;
  }

  /**
   * Generate certificate for a single student
   */
  async generateCertificate(data) {
    const {
      participantName,
      sportName,
      eventName,
      date,
      studentId,
      eventId,
      orderId
    } = data;

    try {
      await this.ensureCertificatesDirectory();

      // Generate unique UID for certificate
      const uid = this.generateCertificateUID();

      // Read template
      let htmlTemplate = await fs.readFile(this.templatePath, 'utf8');

      // Replace placeholders with actual data
      htmlTemplate = htmlTemplate
        .replace(/\[PARTICIPANT_NAME\]/g, participantName)
        .replace(/\[SPORT_NAME\]/g, sportName)
        .replace(/\[EVENT_NAME\]/g, eventName)
        .replace(/\[DATE\]/g, date)
        .replace(/\[UID\]/g, uid)
        .replace(/\[LOGO_PATH\]/g, `file://${this.logoPath}`);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

      // Generate PDF filename
      const filename = `${uid}.pdf`;
      const filepath = path.join(this.certificatesDir, filename);

      // Generate PDF
      await page.pdf({
        path: filepath,
        width: '1123px',
        height: '794px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      await browser.close();

      // Save certificate record to database
      const certificate = await prisma.certificate.create({
        data: {
          studentId,
          eventId,
          orderId,
          certificateUrl: `/uploads/certificates/${filename}`,
          participantName,
          sportName,
          eventName,
          issueDate: new Date(date),
          uid
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
   * Generate certificates for multiple students
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
   * Get certificates for a student
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
        where: { uid }
      });
      return certificate;
    } catch (error) {
      console.error('❌ Error fetching certificate by UID:', error);
      throw error;
    }
  }
}

module.exports = new CertificateService();
