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
    .text('Convoy', 50, 130);
  generateHr(doc, 160);
  
  const customerInformationTop = 170;

  doc
    .fontSize(10)
    .text("Country:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.countryId.name, 150, customerInformationTop)
    .font("Helvetica")
    .text("Start Date:", 50, customerInformationTop + 15)
    .text(formatDate(invoice.startDate), 150, customerInformationTop + 15)
    .text("End Date:", 50, customerInformationTop + 30)
    .text(formatDate(invoice.endDate), 150, customerInformationTop + 30)

    .font("Helvetica-Bold")
    .text(invoice.charityId.name, 300, customerInformationTop)
    .moveDown();
  generateHr(doc, 220);
}


function generateInvoiceTable(doc, invoice) {
  let invoiceTableTop = 240;
  let position = invoiceTableTop;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    position,
    "ID",
    "Name",
    "Phone",
    "National ID",
    "country",
    "Job"
  );
  generateHr(doc, position + 20);
  doc.font("Helvetica");
    let k = 1;
  for (let i = 0; i < invoice.jobs.length; i++) {
    let item = invoice.jobs[i].usersId;
      
      for(let j=0;j<item.length;j++){
        position += 30;
        generateTableRow(
          doc,
          position,
          k++,
          item[j].name,
         item[j].phone,
          "129930193",  //national Id
          item[j].country,
          item[j].job
        );
        generateHr(doc, position + 20);
        if (position > 650) {
          doc.addPage();
          position = 100;
          doc.font("Helvetica-Bold");
          generateTableRow(
            doc,
            position-40,
            "ID",
            "Name",
            "Phone",
            "National ID",
            "country",
            "Job"
          );
          generateHr(doc, position + 20);
          doc.font("Helvetica");
        }
      }
  }
}



function generateTableRow(
  doc,
  y,
  ID,
  Name,
  Phone,
  National,
  country,
  job
) {
  doc
    .fontSize(10)
    .text(ID, 50, y)
    .text(Name, 100, y)
    .text(Phone, 200, y, )
    .text(National, 300, y,)
    .text(country, 400, y,)
    .text(job, 500, y,);
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
