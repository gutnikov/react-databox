/* eslint-disable */
const express = require('express');
const cors = require('cors');
const timezones = require('./timezones.json');

const app = express();
const port = 4141;

app.use(cors());

app.get('/timezones', (req, res) => {
  const search = req.query.search || '';
  setTimeout(() => {
    res.json({ items: timezones.filter(it => {
        return it.value.indexOf(search) !== -1;
    })});
  }, 200);
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
