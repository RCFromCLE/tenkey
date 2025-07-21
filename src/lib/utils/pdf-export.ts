// PDF Export Utility for Chat Messages and Reports
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { EnhancedMessageFormatter } from '../services/message-formatter-enhanced';

interface ExportOptions {
  title?: string;
  subtitle?: string;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class PDFExporter {
  /**
   * Export chat messages to PDF
   */
  static async exportChatToPDF(
    messages: ChatMessage[],
    companyName: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      title = `${companyName} - SEC Filing Analysis`,
      subtitle = 'Chat History',
      includeMetadata = true,
      includeTimestamps = true,
      format = 'letter',
      orientation = 'portrait'
    } = options;

    // Create PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    // Set up fonts and colors
    pdf.setFont('helvetica');
    
    // Add header
    pdf.setFontSize(20);
    pdf.setTextColor(33, 37, 41); // Dark gray
    pdf.text(title, 20, 20);
    
    pdf.setFontSize(14);
    pdf.setTextColor(108, 117, 125); // Gray
    pdf.text(subtitle, 20, 30);
    
    if (includeMetadata) {
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 38);
      pdf.text(`Total Messages: ${messages.length}`, 20, 44);
    }
    
    // Starting Y position for messages
    let yPosition = includeMetadata ? 55 : 45;
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    
    // Process each message
    for (const message of messages) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Format message content for PDF
      const formattedContent = EnhancedMessageFormatter.formatForPDF(message.content);
      
      // Add role indicator
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      if (message.role === 'user') {
        pdf.setTextColor(59, 130, 246); // Blue
        pdf.text('USER', margin, yPosition);
      } else {
        pdf.setTextColor(34, 197, 94); // Green
        pdf.text('ASSISTANT', margin, yPosition);
      }
      
      // Add timestamp if enabled
      if (includeTimestamps) {
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(156, 163, 175); // Light gray
        pdf.setFontSize(8);
        const timestamp = new Date(message.timestamp).toLocaleString();
        pdf.text(timestamp, pageWidth - margin - 40, yPosition);
      }
      
      yPosition += 5;
      
      // Add message content
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(33, 37, 41); // Dark gray
      pdf.setFontSize(10);
      
      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(formattedContent, contentWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Apply basic formatting
        if (line.startsWith('##')) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text(line.replace(/^#+\s*/, ''), margin, yPosition);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(10);
        } else if (line.startsWith('**') && line.endsWith('**')) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(line.replace(/\*\*/g, ''), margin, yPosition);
          pdf.setFont('helvetica', 'normal');
        } else {
          pdf.text(line, margin, yPosition);
        }
        
        yPosition += 5;
      }
      
      // Add separator between messages
      yPosition += 5;
      pdf.setDrawColor(229, 231, 235); // Light gray
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
    
    // Save the PDF
    pdf.save(`${companyName.replace(/\s+/g, '_')}_Analysis_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export a report element to PDF using html2canvas
   */
  static async exportReportToPDF(
    elementId: string,
    filename: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    const {
      format = 'letter',
      orientation = 'portrait'
    } = options;

    // Temporarily modify styles for better PDF rendering
    const originalBackground = element.style.background;
    element.style.background = 'white';
    
    // Add print-specific styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      #${elementId} * {
        color: black !important;
      }
      #${elementId} .bg-gray-800 {
        background-color: #f3f4f6 !important;
      }
      #${elementId} .text-white {
        color: black !important;
      }
      #${elementId} .text-gray-300 {
        color: #374151 !important;
      }
      #${elementId} .text-gray-400 {
        color: #6b7280 !important;
      }
      #${elementId} .border-gray-700 {
        border-color: #d1d5db !important;
      }
    `;
    document.head.appendChild(styleSheet);

    try {
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF, handling multiple pages if needed
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(filename);
    } finally {
      // Restore original styles
      element.style.background = originalBackground;
      document.head.removeChild(styleSheet);
    }
  }

  /**
   * Generate a formatted text version of chat for PDF
   */
  static generateTextReport(
    messages: ChatMessage[],
    companyName: string,
    includeAnalysis: boolean = false
  ): string {
    let report = `# ${companyName} - SEC Filing Analysis Report\n\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    report += `---\n\n`;

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? 'USER QUESTION' : 'AI ANALYSIS';
      const timestamp = new Date(message.timestamp).toLocaleString();
      
      report += `## ${role} (${timestamp})\n\n`;
      report += `${message.content}\n\n`;
      
      if (index < messages.length - 1) {
        report += `---\n\n`;
      }
    });

    return report;
  }

  /**
   * Download text content as a file
   */
  static downloadTextFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
