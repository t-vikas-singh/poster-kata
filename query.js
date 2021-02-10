const Client = require('pg').Client
const load  = require('./insert.js')

const axios = require('axios');


async function do_all() {
    const client = new Client({
        user: 'root',
        host: 'localhost',
        database: 'root',
        password: 'root',
        port: 5432,
    })

    await client.connect();
    console.log('Quering the Database....')
    let res = await client.query('SELECT  * from source');

    let resultSet = [];
    Object.assign(resultSet, res.rows);
    console.log('Getting list of all the starships....')
    let allStarships = await getAllStarships();

    console.log('Merging list of all the starships....')
    let extractData = await extractAndTransform(allStarships, resultSet);

    console.log('Loading data on to the destination....')
    let fnrows = await load.load(extractData);
    //console.log(fnrows);
    await client.end();

}


async function getAllStarships() {

    let starshipList = [];
    let response = await axios.get('https://swapi.dev/api/starships');
    starshipList = starshipList.concat(response.data.results);
    let next = response.data.next;
    while (next) {
        response = await axios.get(next);
        starshipList = starshipList.concat(response.data.results);
        next = response.data.next;
    }
    return starshipList;
}

async function extractAndTransform(allStarships, dbRows) {
    let extract = [];
    for (let i = 0; i < dbRows.length; i++) {
        let starShip = allStarships.find(ship => ship.name == dbRows[i].poster_content);
        if (starShip) {
            let filmAppearance = [];
            for (let k = 0; k < starShip.films.length; k++) {
                let response = await axios.get(starShip.films[k]);
                filmAppearance.push(response.data.title)
            }

            extract.push({
                poster_content: dbRows[i].poster_content,
                quantity: dbRows[i].quantity,
                price: dbRows[i].price,
                sales_rep: dbRows[i].sales_rep,
                promo_code: dbRows[i].promo_code,
                films: filmAppearance
            });
        }
    }
    return extract
};


/*async function load(rows, client) {

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
    let text = 'INSERT INTO source(poster_content, quantity, price, sales_rep, promo_code, film) VALUES($1, $2, $3, $4, $5, $6) RETURNING *'

    for (let i = 0; i < finalRows.length; i++) {
        console.log(finalRows[i]);
        let values = [finalRows[i].poster_content, finalRows[i].quantity, finalRows[i].price, finalRows[i].sales_rep, finalRows[i].promo_code, finalRows[i].film];
        await client.query(text, values);
    }

    //return finalRows;

}*/


do_all();
