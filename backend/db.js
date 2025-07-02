const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  items: [],
  customers: [],
  vendors: [],
  purchaseOrders: [],
  orders: []
});

async function initDB() {
  await db.read();
  await db.write();
}

initDB();

module.exports = db; 