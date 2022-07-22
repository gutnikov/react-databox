/* eslint-disable */
const express = require('express');
const cors = require('cors');
const timezones = require('./timezones.json');

const app = express();
const port = 4141;

app.use(cors());

app.get('/timezones', (req, res) => {
  const delay = Number.parseInt(req.query.delay);
  console.log()
  setTimeout(() => {
    res.json({ items: timezones.filter(it => {
        return it.value.indexOf(req.query.search) !== -1;
    })});
  }, Number.isNaN(delay) ? 200 : delay);
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
