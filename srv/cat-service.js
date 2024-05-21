const cds = require('@sap/cds')
const { Books } = cds.entities('sap.capire.bookshop')
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const { Readable } = require('stream');

class CatalogService extends cds.ApplicationService {
  init() {

    // Reduce stock of ordered books if available stock suffices
    this.on('submitOrder', async req => {
      const { book, quantity } = req.data
      let { stock } = await SELECT`stock`.from(Books, book)
      if (stock >= quantity) {
        await UPDATE(Books, book).with(`stock -=`, quantity)
        await this.emit('OrderedBook', { book, quantity, buyer: req.user.id })
        return { stock }
      }
      else return req.error(409, `${quantity} exceeds stock for book #${book}`)
    })

    // Add some discount for overstocked books
    this.after('READ', 'ListOfBooks', each => {
      if (each.stock > 111) each.title += ` -- 11% discount!`
    })

    this.on('READ', 'BooksUI', async req => {
      const { book } = req.data
      let fragment = "BooksList";
      let data;
      if (book) {
        fragment = "BooksDetail";
        data = await SELECT.from(Books, book);
      }else{
        data = {Books:(await SELECT.from(Books))};
      }
      const filedata = fs.readFileSync(path.join(__dirname, './fragments', `${fragment}.fragment.xml`));
      const template = Handlebars.compile(filedata.toString());
      const result = template(data);
      const readableInstanceStream = new Readable({
        read() {
          this.push(result);
          this.push(null);
        }
      });
      req._.res.setHeader('Content-disposition', `attachment; ${fragment}.fragment.xml`);
      req._.res.setHeader('Content-type', 'application/xml');
      return {
        value: readableInstanceStream
      };
    });

    return super.init()
  }
}

module.exports = { CatalogService }
