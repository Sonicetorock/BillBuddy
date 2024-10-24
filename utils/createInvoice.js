const fs = require('fs');
const PDFDocument = require('pdfkit');
const User = require('../models/userModel');

// anybody can download the invoice with just expenseID , so we need to pass the userId to check if the user is pariticipant in this expense and downloading the invoice
async function createInvoice(expense, path, userId) {
    // A4 page 
    let doc = new PDFDocument({ size: "A4", margin: 50 });
    const writeStream = fs.createWriteStream(path);
    doc.pipe(writeStream);

    doc.registerFont('Montserrat-Bold', 'fonts/Montserrat-Bold.ttf');
    doc.registerFont('Montserrat', 'fonts/Montserrat-Regular.ttf');

    generateHeader(doc);
    generateCustomerInformation(doc, expense);
    const lastTablePosition = await generateInvoiceTable(doc, expense, userId);
    generateFooter(doc, expense, lastTablePosition);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            resolve();
        });
        writeStream.on('error', reject);
        doc.end();
    });
}

function generateHeader(doc) {
    doc.image('peeps-avatar.png', 50, 45, { width: 50, height: 50 })
       .fillColor('#333333')
       .font('Montserrat-Bold')
       .fontSize(28)
       .text('Expense Balance Sheet', 110, 50)
       .fontSize(12)
       .font('Montserrat')
       .text(`#INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, 110, 85)
       .moveDown();
}

function generateCustomerInformation(doc, expense) {
    const customerInformationTop = 140;

    doc.fontSize(14)
       .font('Montserrat-Bold')
       .text('Bill Buddy', 50, customerInformationTop)
       .font('Montserrat')
       .fontSize(12)
       .text('Tada', 50, customerInformationTop + 20)
       .text('AP, 517646', 50, customerInformationTop + 40);

    // Expense details
    doc.fontSize(12)
       .font('Montserrat')
       .text('Date :', 300, customerInformationTop)
       .font('Montserrat-Bold')
       .text(new Date().toLocaleDateString(), 400, customerInformationTop)
       .font('Montserrat')
       .text('Pay Type :', 300, customerInformationTop + 20)
       .font('Montserrat-Bold')
       .text('Split Payment', 400, customerInformationTop + 20)
       .font('Montserrat')
       .text('Split Method :', 300, customerInformationTop + 40)
       .font('Montserrat-Bold')
       .text(expense.splitMethod.toUpperCase(), 400, customerInformationTop + 40);

    doc.font('Montserrat-Bold')
       .fontSize(14)
       .text('Description:', 50, customerInformationTop + 80)
       .text(expense.description, 150, customerInformationTop + 80);

    generateHr(doc, customerInformationTop + 110);
}

async function generateInvoiceTable(doc, expense, userId) {
    const tableTop = 280;
    let currentTop = tableTop;

    // Header background 
    doc.fillColor('#f8f9fa')
       .rect(40, currentTop - 10, 520, 30)
       .fill();
    
    // Table headers
    doc.fillColor('#333333')
       .font("Montserrat-Bold")
       .fontSize(11);

    const columns = {
        participant: { x: 50, width: 90 },
        email: { x: 140, width: 180 },
        phone: { x: 320, width: 90 },
        amount: { x: 390, width: 85 },
        status: { x: 480, width: 70 }
    };

    generateTableRow(
        doc,
        currentTop,
        ["Participant", "Email", "Phone", "Amount Owed", "Status"],
        [columns.participant.x, columns.email.x, columns.phone.x, columns.amount.x, columns.status.x],
        [columns.participant.width, columns.email.width, columns.phone.width, columns.amount.width, columns.status.width]
    );

    generateHr(doc, currentTop + 20);
    doc.font("Montserrat");

    const participantsInfo = await Promise.all(
        expense.participants.map(async (participant) => {
            const userInfo = await User.findById(participant.user);
            return { userInfo, participant };
        })
    );

    doc.fontSize(10);
    for (let i = 0; i < participantsInfo.length; i++) {
        const { userInfo, participant } = participantsInfo[i];
        currentTop += 30;

        generateTableRow(
            doc,
            currentTop,
            [
                // if user is present in this split and is downloading then added (You) to the name
                // else if an outsider is downloading then just the name
                userId === userInfo._id.toString() ? `${userInfo.name.charAt(0).toUpperCase() + userInfo.name.slice(1)} (You)` : userInfo.name.charAt(0).toUpperCase() + userInfo.name.slice(1),
                userInfo.email,
                userInfo.mobile,
                // if split method is percentage then show the percentage with in brackets amount else only show the amount
                expense.splitMethod === 'percentage' ? `${participant.amountOwed}% (${(expense.totalAmount * participant.amountOwed / 100).toFixed(2)})` : (participant.amountOwed).toFixed(2),
                participant.status.toUpperCase()
            ],
            [columns.participant.x, columns.email.x, columns.phone.x, columns.amount.x, columns.status.x],
            [columns.participant.width, columns.email.width, columns.phone.width, columns.amount.width, columns.status.width]
        );
        generateHr(doc, currentTop + 20);
    }

    return currentTop + 20;
}

function generateTableRow(doc, y, items, xPositions, widths) {
    items.forEach((item, i) => {
        // if status is paid, color the status  green else red
        if (i === 4) {
            doc.fillColor(items[i] === 'PAID' ? '#28a745' : '#dc3545');
        } else {
            doc.fillColor('#333333');
        }
        doc.text(
            item.toString(),
            xPositions[i],
            y,
            {
                width: widths[i],
                align: i >= 3 ? 'right' : 'left',
            }
        );
    });
}

function generateFooter(doc, expense, lastTablePosition) {
    const pageHeight = 842; // A4 height in points
    const footerPosition = Math.max(lastTablePosition + 40, pageHeight - 200);
    
    // if split method is percentage then calculate the total amount paid and balance due
    const totalPaid = expense.participants
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + (expense.splitMethod === "percentage" ? expense.totalAmount * p.amountOwed / 100 : p.amountOwed), 0);

    const balanceDue = expense.participants
        .filter(p => p.status !== 'paid')
        .reduce((acc, p) => acc +( expense.splitMethod === "percentage" ? expense.totalAmount * p.amountOwed / 100 :p.amountOwed), 0);

    doc.font('Montserrat-Bold')
       .fontSize(12);

    // Subtotal
    doc.fillColor('#666666')    
    doc.text('Subtotal for this expense:', 300, footerPosition)
       .text(`₹${expense.totalAmount.toFixed(2)}`, 470, footerPosition, { align: 'right' });
    
    // Amount Paid
    doc.fillColor('#28a745')
    doc.text('Amount Paid for this expense :', 300, footerPosition + 25)
       .text(`₹${totalPaid.toFixed(2)}`, 470, footerPosition + 25, { align: 'right' });
    
    // Balance Due 
    doc.fillColor('#dc3545')
       .text('Balance Due for this expense:', 300, footerPosition + 50)
       .text(`₹${balanceDue.toFixed(2)}`, 470, footerPosition + 50, { align: 'right' });

    doc.fillColor('#666666')
       .fontSize(11)
       .font('Montserrat')
       .text(
           'Thank you from heart of Bill Buddy Group',
           0,
           footerPosition + 100,
           {
               align: 'center',
               width: 600
           }
       );
}

function generateHr(doc, y) {
    doc.strokeColor("#e9ecef")
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(550, y)
       .stroke();
}

module.exports = { createInvoice };