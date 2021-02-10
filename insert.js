const Client = require('pg').Client


const dest_client = new Client({
    user: 'root',
    host: 'localhost',
    database: 'root',
    password: 'root',
    port: 5400,
});

exports.load = load

async function load(rows) {
    await dest_client.connect();


    let finalRows = [];
    rows.forEach(poster => {
        poster.films.forEach(film => {
            finalRows.push({
                poster_content: poster.poster_content,
                quantity: poster.quantity,
                price: poster.price,
                sales_rep: poster.sales_rep,
                promo_code: poster.promo_code,
                film: film
            })
        });
    });
    let text = 'INSERT INTO dw(poster_content, quantity, price, sales_rep, promo_code, film) VALUES($1, $2, $3, $4, $5, $6) RETURNING *'

    for (let i = 0; i < finalRows.length; i++) {
        console.log(finalRows[i]);
        let values = [finalRows[i].poster_content, finalRows[i].quantity, finalRows[i].price, finalRows[i].sales_rep, finalRows[i].promo_code, finalRows[i].film];
        await dest_client.query(text, values);
    }

    await dest_client.end();

}
