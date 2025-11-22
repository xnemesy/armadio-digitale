
const express = require('express');
const app = express();
const port = 3001;

app.get('/', (req, res) => {
  res.send('MCP Cache Server per Armadio Digitale è in esecuzione.');
});

app.listen(port, () => {
  console.log(`Server di cache in ascolto su http://localhost:${port}`);
});
