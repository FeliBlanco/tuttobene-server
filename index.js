const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const path = require('path');


const app = express()

app.use(cors())
app.use(fileUpload());
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: false,
}))


app.set('PORT', 3001)

app.listen(app.get('PORT'), () => {
    console.log(`Server listening on port ${app.get('PORT')}...`)
})


/*const con = mysql.createConnection({
    host:'000webhostapp.com',
    database:'id19054144_tuttobene',
    user:'id19054144_root',
    password:'4]g]TbK1WQqRyvq'
})*/

const con = mysql.createConnection({
    host:'localhost',
    database:'tuttobene',
    user:'root',
    password:''
})

con.connect(function(err) {
    if (err) throw err;
    console.log("Base de datos conectada!");
});


app.get('/api/products/getAll', (req, res) => {
    con.query(`
        SELECT *, V.nombre AS vNombre, V.id AS vId, P.descripcion AS pDescripcion, P.nombre AS pNombre, P.id AS pId, VV.valor AS vvNombre, VV.id AS vvId
            from productos P 
        LEFT JOIN variaciones V ON V.productoid = P.id 
        LEFT JOIN variaciones_value VV ON VV.variacionid = V.id
    `, [], (err, result) => {
        let data = []

        for(let i = 0; i < result.length; i++) {

            const productoId = data.findIndex(j => j.pId == result[i].pId)

            if(productoId != -1) {

                const variacionId = data[productoId].variaciones.findIndex(j => j.id == result[i].vId)
                if(variacionId != -1) {
                    data[productoId].variaciones[variacionId].values.push({
                        nombre: result[i].vvNombre,
                        id: result[i].vvId
                    })
                } else {
                    data[productoId].variaciones.push({
                        id: result[i].vId,
                        nombre: result[i].vNombre,
                        values: []
                    })
                }

            } else {
                data.push({
                    id: result[i].pId,
                    nombre: result[i].pNombre,
                    precio: result[i].precio,
                    categoria: result[i].categoria,
                    imagen: result[i].imagen,
                    descripcion: result[i].pDescripcion,
                    formato: result[i].formato_de_venta,
                    disponibilidad: result[i].disponibilidad,
                    variaciones: []
                })
            }
        
        }
        res.json(data)
    })
})

app.post('/api/products/delete', (req, res) => {

    const { id } = req.body
    if(!id) return res.sendStatus(500)
    con.query(`DELETE FROM productos WHERE id = ?`, [productoid], (err, result) => {
        if(err) return res.sendStatus(500)
        res.send({code: 1})
    })
})

app.post('/api/products/add', async (req, res) => {
    const { 
        nombre,
        precio,
        categoria,
        descripcion,
        formato,
        variaciones
    } = req.body

    console.log(req.body)
    console.log(req.files)

    if(!req.files) return res.sendStatus(500)
    const img = req.files.imgs


    if(!nombre) return res.sendStatus(500)
    if(!precio) return res.sendStatus(500)
    if(!categoria) return res.sendStatus(500)
    if(!descripcion) return res.sendStatus(500)
    if(!formato) return res.sendStatus(500)
    if(!variaciones) return res.sendStatus(500)


    let imagen = ""


    con.query(`
        INSERT INTO productos (nombre, precio, categoria, imagen, descripcion, formato_de_venta) VALUES (?, ?, ?, ?, ?, ?)
    `, [nombre, precio, categoria, imagen, descripcion, formato], async (err, result) => {
        if(err) return res.sendStatus(500)

        const productId = result.insertId

        for(let i = 0; i < variaciones.length; i++) {
            con.query(`INSERT INTO variaciones (nombre, productoid) VALUES (?, ?)`, [variaciones[i].nombre, productId], async (err2, result2) => {
                if(err2) return res.sendStatus(500)

                const variacionId = result2.insertId

                for(let j = 0; j < variaciones[i].length; j++) {
                    con.query(`INSERT INTO variaciones_value (valor, variacionid) VALUES (?, ?)`, [ variaciones[i].options[j].value, variacionId ], async (err3, result3) => {
                        if(err3) return res.sendStatus(500)
                    })
                }

            })
        }

        img.mv(`${__dirname}/imagenes/productos/dsada.jpg`, (err) => {
            if(err) return console.log(err)
        })
    })
    //res.send({code: 1})
})


/* CATEGORIAS */

app.get('/api/categories/get', (req, res) => {
    con.query(`SELECT C.*, (SELECT COUNT(*) FROM productos p WHERE p.categoria = C.id) as productos FROM categorias C `, [], (err, result) => {
        if(err) return res.sendStatus(500)

        res.send({code: 1, data: result})
    })
})

app.post('/api/categories/delete', (req, res) => {

    const { id } = req.body;
    if(!id) return res.sendStatus(500)
    con.query("DELETE FROM categorias WHERE id = ?", [id], (err) => {
        if(err) return res.sendStatus(500)
        res.send({code: 1})
    });
})

app.post('/api/categories/add', (req, res) => {

    const { nombre, subcat } = req.body

    if(!nombre) return res.sendStatus(500)
    if(!subcat) return res.sendStatus(500)

    con.query('INSERT INTO categorias (nombre, subcat) VALUES (?, ?)', [nombre, subcat], (err, result) => {
        if(err) return res.sendStatus(500)
        console.log(result)
        res.send({code: 1})
    })
})

app.post('/api/categories/edit', (req, res) => {
    const { id, nombre } = req.body
    if(!nombre) return res.sendStatus(500)
    if(!id) return res.sendStatus(500)  

    con.query("UPDATE categorias set nombre = ? WHERE id = ? ", [nombre, id], (err, result) => {
        if(err) return res.sendStatus(500)
        res.send({code: 1})
    });
})