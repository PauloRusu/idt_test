const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;
const NYT_API_KEY = 'KsOLKvpI8lAyMFbVkFoG7GKmCgHYPUur';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

app.get('/lists', async (req, res) => {
    try {
        // Effettua una richiesta GET alle API del NY Times
        const response = await axios.get('https://api.nytimes.com/svc/books/v3/lists/names.json', {
            params: {
                'api-key': NYT_API_KEY // Sostituisci con il tuo API key
            }
        });

        // Estrai i dati dalla risposta e inviali come risposta al client
        const lists = response.data.results.map(list => ({
            list_name: list.list_name
        }));

        res.json(lists);
    } catch (error) {
        console.error('Errore durante la richiesta delle liste di libri:', error.message);
        res.status(500).json({ error: 'Errore durante la richiesta delle liste di libri' });
    }
});


app.get('/lists/:listName', async (req, res) => {
    const { listName } = req.params;

    try {
        const response = await axios.get(`https://api.nytimes.com/svc/books/v3/lists.json?list=${listName}&api-key=${NYT_API_KEY}`);
        const books = await Promise.all(response.data.results.map(async (book) => {
            const googleBooksPreviewLink = await getGoogleBooksPreviewLink(book.book_details[0].title);
            return {
                title: book.book_details[0].title,
                author: book.book_details[0].author,
                google_books_preview_link: googleBooksPreviewLink,
            };
        }));
        res.json(books);
    } catch (error) {
        console.error(`Errore durante la richiesta dei libri dalla lista ${listName} del NY Times:`, error);
        res.status(500).json({ error: `Errore durante la richiesta dei libri dalla lista ${listName} del NY Times` });
    }
});

// Funzione per ottenere il link alla preview del libro su Google Books
async function getGoogleBooksPreviewLink(title) {
    try {
        const response = await axios.get(`${GOOGLE_BOOKS_API_URL}?q=intitle:${encodeURIComponent(title)}`);
        const book = response.data.items[0];
        if (book && book.volumeInfo.previewLink) {
            return book.volumeInfo.previewLink;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Errore durante la richiesta della preview del libro su Google Books:', error);
        return null;
    }
}

app.listen(port, () => {
    console.log(`Server in esecuzione sulla porta ${port}`);
});