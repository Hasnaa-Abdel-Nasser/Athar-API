import PDFDocument from "pdfkit";

export async function createInvoice(invoice) {
  const doc = new PDFDocument({ bufferPages: true });
  // Add content to the PDF document using pdfkit API methods
  console.log('Hi in pdf')
  generateHeader(doc);
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  // Return the generated PDF document as a buffer
  return new Promise((resolve, reject) => {
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });
    doc.end();
  });
}
function generateHeader(doc) {
  doc
    // .image("logo.png", 45, 45, { width: 60 })
    .fillColor("#444444")
    .fontSize(20)
    .text("Athar", 50, 65)
    .fontSize(10)
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text('Report', 50, 150);
  generateHr(doc, 180);
}

function generateInvoiceTable(doc, invoice) {
  let invoiceTableTop = 210;
  let position = invoiceTableTop;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    position,
    "ID",
    "Country",
    "Donation Boxes",
    "Convoys",
    "Volunteers"
  );
  generateHr(doc, position + 20);
  doc.font("Helvetica");
    let k = 1;
  for (let i = 0; i < invoice.length; i++) {
    
      position += 30;
      if (position > 650) {
        doc.addPage();
        position = 100;
        doc.font("Helvetica-Bold");
        generateTableRow(
          doc,
          position-40,
          "ID",
    "Country",
    "Donation Boxes",
    "Convoys",
    "Volunteers"
        );
        generateHr(doc, position + 20);
        doc.font("Helvetica");
      }
      generateTableRow(
        doc,
        position,
        k++,
        invoice[i].name,
        invoice[i].donationBoxes,
        invoice[i].convoysNumber,
        invoice[i].volunteers
      );
      generateHr(doc, position + 20);
  }
}



function generateTableRow(
  doc,
  y,
  number,
  name,
  donationBoxes,
  convoysNumber,
  volunteers
) {
  doc
    .fontSize(10)
    .text(number, 50, y)
    .text(name, 130, y)
    .text(donationBoxes, 250, y, )
    .text(convoysNumber, 400, y,)
    .text(volunteers, 480, y,);
}

function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return day + " / " + month + " / " + year;
}
