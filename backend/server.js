// npm start; gcloud app deploy

const express = require('express');
const path = require(`path`);
const ejs = require('ejs');

const app = express();
// app.use(express.json); // JSON
// app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, 'public')));
// app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.send('Hello from App Engine!');
});

app.get('/heatmap', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views/heatmap.html'));
});

app.get('/submit', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/form.html')); //broken link
});

app.post('/submit', (req, res) => {
  console.log({
    name: req.body.name,
    message: req.body.message,
  });
  res.send('Thanks for your message!');
});



// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
