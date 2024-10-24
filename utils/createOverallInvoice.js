const fs = require('fs');
const PDFDocument = require('pdfkit');
const Expense = require('../models/expenseModel');
const User = require('../models/userModel');

// A4 page constants
const PAGE_HEIGHT = 842; // A4 height in points
const HEADER_HEIGHT = 120;
const FOOTER_HEIGHT = 100;
const ROW_HEIGHT = 30;
const TABLE_TOP_MARGIN = 150;

// async function createOverallInvoice(path) {
//     try {
//         const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
//         const writeStream = fs.createWriteStream(path);
//         doc.pipe(writeStream);

//         doc.registerFont('Montserrat-Bold', 'fonts/Montserrat-Bold.ttf');
//         doc.registerFont('Montserrat', 'fonts/Montserrat-Regular.ttf');

//         generateHeader(doc);
//         const lastTablePosition = await generateOverallTable(doc);
//         generateFooter(doc, lastTablePosition);

//         return new Promise((resolve, reject) => {
//             writeStream.on('finish', () => {
//                 resolve();
//             });
//             writeStream.on('error', reject);
//             doc.end();
//         });
//     } catch (error) {
//         console.error('Error creating overall invoice:', error);
//         throw error;
//     }
// }
async function createOverallInvoice(path) {
    try {
        const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
        const writeStream = fs.createWriteStream(path);
        doc.pipe(writeStream);

        doc.registerFont('Montserrat-Bold', 'fonts/Montserrat-Bold.ttf');
        doc.registerFont('Montserrat', 'fonts/Montserrat-Regular.ttf');

        generateHeader(doc);
        const { lastTablePosition, totalTransactionAmount, totalAmountPaid, stillToBePaid } = await generateOverallTable(doc);
        generateFooter(doc, lastTablePosition, totalTransactionAmount, totalAmountPaid, stillToBePaid);

        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                resolve();
            });
            writeStream.on('error', reject);
            doc.end();
        });
    } catch (error) {
        console.error('Error creating overall invoice:', error);
        throw error;
    }
}

function generateHeader(doc) {
    doc.image('peeps-avatar.png', 50, 45, { width: 50, height: 50 })
       .fillColor('#333333')
       .font('Montserrat-Bold')
       .fontSize(28)
       .text('Overall Balance Sheet', 110, 50)
       .moveDown();
}

function generateTableHeader(doc, y) {
    const columns = {
        participant: { x: 50, width: 90 },
        description: { x: 140, width: 150 },
        type: { x: 290, width: 80 },
        amount: { x: 370, width: 100 },
        status: { x: 470, width: 90 }
    };

    // Table header background
    doc.fillColor('#f8f9fa')
       .rect(40, y - 10, 520, 30)
       .fill();
    
    doc.fillColor('#333333')
       .font("Montserrat-Bold")
       .fontSize(11);

    // Generate header row
    generateTableRow(
        doc,
        y,
        ["Participant", "Description", "Type", "Amount Owed", "Status"],
        [columns.participant.x, columns.description.x, columns.type.x, columns.amount.x, columns.status.x],
        [columns.participant.width, columns.description.width, columns.type.width, columns.amount.width, columns.status.width]
    );

    generateHr(doc, y + 20);
    doc.font("Montserrat");

    return columns;
}

// async function generateOverallTable(doc) {
//     let currentTop = TABLE_TOP_MARGIN;
//     const expenses = await Expense.find().populate('participants.user');
    
//     if (!expenses || expenses.length === 0) {
//         doc.text('No expenses found', 50, currentTop + 40);
//         return currentTop + 60;
//     }

//     let columns = generateTableHeader(doc, currentTop);
//     currentTop += ROW_HEIGHT;

//     for (let expense of expenses) {
//         if (!expense.participants) continue;

//         for (let participant of expense.participants) {
//             if (!participant || !participant.user) continue;

//             const userInfo = await User.findById(participant.user);
//             if (!userInfo) continue;

//             // Custom calculation for percentage splits
//             let amountOwed = participant.amountOwed;
//             if (expense.splitMethod === 'percentage') {
//                 amountOwed = (expense.totalAmount * participant.amountOwed / 100).toFixed(2);
//             } else {
//                 amountOwed = (participant.amountOwed).toFixed(2);
//             }

//             // Check if we need a new page
//             if (currentTop + ROW_HEIGHT > PAGE_HEIGHT - FOOTER_HEIGHT) {
//                 doc.addPage();
//                 currentTop = HEADER_HEIGHT;
//                 generateHeader(doc);
//                 columns = generateTableHeader(doc, currentTop);
//                 currentTop += ROW_HEIGHT;
//             }

//             const rowData = [
//                 (userInfo.name || 'Unknown').charAt(0).toUpperCase() + (userInfo.name || 'Unknown').slice(1),
//                 expense.description || 'No description',
//                 expense.splitMethod.toLocaleUpperCase(),
//                 amountOwed,
//                 (participant.status).toUpperCase()
//             ];

//             generateTableRow(
//                 doc,
//                 currentTop,
//                 rowData,
//                 [columns.participant.x, columns.description.x, columns.type.x, columns.amount.x, columns.status.x],
//                 [columns.participant.width, columns.description.width, columns.type.width, columns.amount.width, columns.status.width]
//             );

//             generateHr(doc, currentTop + 20);
//             currentTop += ROW_HEIGHT;
//         }
//     }

//     return currentTop;
// }
async function generateOverallTable(doc) {
    let currentTop = TABLE_TOP_MARGIN;
    const expenses = await Expense.find().populate('participants.user');

    if (!expenses || expenses.length === 0) {
        doc.text('No expenses found', 50, currentTop + 40);
        return currentTop + 60;
    }

    let columns = generateTableHeader(doc, currentTop);
    currentTop += ROW_HEIGHT;

    let totalTransactionAmount = 0;
    let totalAmountPaid = 0;
    let stillToBePaid = 0;

    for (let expense of expenses) {
        if (!expense.participants) continue;

        totalTransactionAmount += expense.totalAmount;

        for (let participant of expense.participants) {
            if (!participant || !participant.user) continue;

            const userInfo = await User.findById(participant.user);
            if (!userInfo) continue;

            let amountOwed = participant.amountOwed;
            if (expense.splitMethod === 'percentage') {
                amountOwed = (expense.totalAmount * participant.amountOwed / 100).toFixed(2);
            } else {
                amountOwed = (participant.amountOwed).toFixed(2);
            }

            if (participant.status === 'paid') {
                totalAmountPaid += parseFloat(amountOwed);
            } else {
                stillToBePaid += parseFloat(amountOwed);
            }

            // Check if we need a new page
            if (currentTop + ROW_HEIGHT > PAGE_HEIGHT - FOOTER_HEIGHT) {
                doc.addPage();
                currentTop = HEADER_HEIGHT;
                generateHeader(doc);
                columns = generateTableHeader(doc, currentTop);
                currentTop += ROW_HEIGHT;
            }

            const rowData = [
                (userInfo.name || 'Unknown').charAt(0).toUpperCase() + (userInfo.name || 'Unknown').slice(1),
                expense.description || 'No description',
                expense.splitMethod.toLocaleUpperCase(),
                amountOwed,
                (participant.status).toUpperCase()
            ];

            generateTableRow(
                doc,
                currentTop,
                rowData,
                [columns.participant.x, columns.description.x, columns.type.x, columns.amount.x, columns.status.x],
                [columns.participant.width, columns.description.width, columns.type.width, columns.amount.width, columns.status.width]
            );

            generateHr(doc, currentTop + 20);
            currentTop += ROW_HEIGHT;
        }
    }

    // Return the calculated totals to use in the footer
    return { lastTablePosition: currentTop, totalTransactionAmount, totalAmountPaid, stillToBePaid };
}

function generateTableRow(doc, y, items, xPositions, widths) {
    items.forEach((item, i) => {
        const safeItem = item ?? '';
        
        if (i === 4) {
            doc.fillColor(safeItem === 'PAID' ? '#28a745' : '#dc3545');
        } else {
            doc.fillColor('#333333');
        }
        
        doc.text(
            String(safeItem),
            xPositions[i],
            y,
            {
                width: widths[i],
                align: i >= 3 ? 'right' : 'left',
                lineBreak: false
            }
        );
    });
}

// function generateFooter(doc, lastTablePosition) {
//     const totalPages = doc.bufferedPageRange().count;
//     let currentPage = 1;

//     for (let i = 0; i < totalPages; i++) {
//         doc.switchToPage(i);
//         const footerTop = PAGE_HEIGHT - FOOTER_HEIGHT;

//         doc.fillColor('#666666')
//            .fontSize(11)
//            .font('Montserrat')
//            .text('Thank you from Bill Buddy', 0, footerTop, { align: 'center', width: 600 })
//            .text(`Page ${currentPage} of ${totalPages}`, 0, footerTop + 20, { align: 'center', width: 600 });

//         currentPage++;
//     }
// }
function generateFooter(doc, lastTablePosition, totalTransactionAmount, totalAmountPaid, stillToBePaid) {
    const footerPosition = Math.max(lastTablePosition + 40, PAGE_HEIGHT - 200);
    
    doc.font('Montserrat-Bold')
       .fontSize(12);

    // Subtotal
    doc.fillColor('#666666')    
       .text('Subtotal for all expenses:', 300, footerPosition)
       .text(`₹${totalTransactionAmount.toFixed(2)}`, 470, footerPosition, { align: 'right' });
    
    // Total Amount Paid
    doc.fillColor('#28a745')
       .text('Total Amount Paid:', 300, footerPosition + 25)
       .text(`₹${totalAmountPaid.toFixed(2)}`, 470, footerPosition + 25, { align: 'right' });
    
    // Amount Still to be Paid 
    doc.fillColor('#dc3545')
       .text('Amount Still to be Paid:', 300, footerPosition + 50)
       .text(`₹${stillToBePaid.toFixed(2)}`, 470, footerPosition + 50, { align: 'right' });

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

module.exports = { createOverallInvoice };
