// npm start; gcloud app deploy client.yaml

const express = require('express');
const path = require(`path`);
// const cors = require('cors');

const app = express();
// app.use(express.json); // JSON
// app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'public', "dist")));

app.get('/', (req, res) => {
  // res.send('Hello from App Engine!');
  app.use(express.static(path.join(__dirname, 'public', "dist")));
  // res.sendFile(path.join(__dirname, 'public/views/heatmap.html'));
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});

app.get('/heatmap', (req, res) => {
  app.use(express.static(path.join(__dirname, 'public', "dist")));
  // res.sendFile(path.join(__dirname, 'public/views/heatmap.html'));
  res.sendFile(path.join(__dirname, 'public/dist/index.html'));
});


// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
