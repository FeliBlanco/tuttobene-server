const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const path = require('path');


const app = express()

app.use(cors())
app.use(fileUpload());
app.use(bodyParser.json({ limit: '80mb' }))
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


/* USERS */

app.post('/api/user/login', async (req, res) => {

    const { nombre, password } = req.body

    if(!nombre) return res.status(500).send({err: 'nombre is required.'})
    if(!password) return res.status(500).send({err: 'password is required.'})

    const [err, result] = await mysqlQuery(`SELECT * FROM usuarios WHERE nombre = ? AND contra = ? LIMIT 1`, [nombre, password])

    if(err) return res.status(500).send({err: 'MySQL error.'})
    if(result.length > 0) {
        const token = randomString(30)
        const fecha = new Date;

        await mysqlQuery(`INSERT INTO sesiones (usuario, fecha, token) VALUES (?, ?, ?)`, [result[0].id, fecha, token])
        res.send({code: 1, token})
    }
    else {
        res.send({code: 0})
    }
})

app.post('/api/user/get', async (req, res) => {
    const { token } = req.body

    if(!token) return res.status(500).res({err: 'token is required.'})

    const [err, result] = await mysqlQuery(`SELECT * FROM sesiones S INNER JOIN usuarios U ON U.id = S.usuario WHERE S.token = ? LIMIT 1`, [token])
    if(err) return res.status(500).res({err: 'MySQL error.'})

    if(result.length > 0) {
        res.send({code: 1, data: result[0]})
    } else {
        res.send({code: 0})
    }
})

/* PEDIDOS */

app.post('/api/admin/pedido', async(req, res) => {

    let  {
        enviar,
        productos,
        nombre,
        telefono,
        direccion,
        ciudad
    } = req.body

    productos = JSON.parse(productos)

    if(enviar == 1)
    {
        console.log("ENVIAR 1")
        crear_compra(
            productos,
            nombre,
            telefono,
            direccion,
            ciudad,
            0,
            1
        );
    } else {
        console.log("ENVIAR 0")
        crear_compra(
            productos,
            '-',
            telefono,
            '',
            '',
            1,
            0
        );
    }
    res.send({code: 1})
})

app.post('/api/pedidos/send', async(req, res) => {

    let {
        formaPago,// 0 = mercadoPago | 1 = Efectivo
        formaEnvio,// 0 = Domicilio | 1 = Local
        productos,
        nombre,
        telefono,
        direccion,
        ciudad,
    } = req.body


    productos = JSON.parse(productos);

    if(formaPago == 0) {

    } else {
        if(crear_compra(
            productos,
            nombre,
            telefono,
            direccion,
            ciudad,
            formaPago,
            formaEnvio
        ))
        {
            res.send({code: 1})
        } else {
            res.send({code: 0})
        }
    }

})

/* PRODUCTOS */

app.post('/api/products/delete-variation', async (req, res) => {

    const { id } = req.body

    if(!id) return res.status(500).send({err: 'id is required'})

    await mysqlQuery('DELETE FROM `variaciones_value` WHERE id = ?', [id])
    res.send({code: 1})
})

app.post('/api/products/update', async (req, res) => {
    let { producto } = req.body

    producto = JSON.parse(producto)

    await mysqlQuery(`
        UPDATE
            productos
        SET 
            nombre= ?,
            precio= ?,
            categoria= ?,
            descripcion= ?,
            formato_de_venta= ?,
            disponibilidad= ?,
            ventas=0
        WHERE 
            id= ?
        `, [
            producto.nombre,
            producto.precio,
            producto.categoria,
            producto.descripcion,
            producto.formato,
            producto.disponibilidad,
            producto.id
    ])
    console.log(producto.variaciones)

        for(let i = 0; i < producto.variaciones.length; i++) {
            await mysqlQuery(`
                UPDATE
                    variaciones
                SET
                    nombre= ?,
                    productoid= ?
                WHERE 
                    id= ?
                `, [
                    producto.variaciones[i].nombre,
                    producto.id,
                    producto.variaciones[i].id,
            ])

            for(let j = 0; j < producto.variaciones[i].values.length; j++) {

                let borrado = false
                if(producto.variaciones[i].values[j].borrado == 1) {
                    await mysqlQuery(`DELETE FROM variaciones_value WHERE id = ?`, [producto.variaciones[i].values[j].id])
                    borrado = 1
                }
                if(!borrado) {
                    await mysqlQuery(`
                    UPDATE
                        variaciones_value
                    SET
                        valor= ?,
                        variacionid= ?
                    WHERE id= ?`, [
                        producto.variaciones[i].values[j].nombre,
                        producto.variaciones[i].id,
                        producto.variaciones[i].values[j].id,
                    ])
                }
            }
        }
        res.send({code: 1})
})

app.post('/api/products/carrito', async (req, res) => {

    let { productos } = req.body
    productos = JSON.parse(productos)

    if(!productos) return res.status(500).send({err: 'productos is required'})

    let data = []

    for(let p = 0; p < productos.length; p++) {
        const [err, result] = await mysqlQuery(`
            SELECT
                P.*,
                V.id AS vId,
                V.nombre AS vNombre,
                VV.id as vvId,
                VV.valor AS vvNombre
            FROM productos P
            LEFT JOIN variaciones V ON P.id = V.productoid 
            LEFT JOIN variaciones_value VV ON V.id = VV.variacionid
            WHERE P.id = ?
        `, [productos[p].id])
        if(!err) {

            for(let i = 0; i < result.length; i++) {
                if(!data[ result[i].id ]) {
                    data[ result[i].id ] = {
                        id: result[i].id,
                        nombre: result[i].nombre,
                        precio: result[i].precio,
                        imagen: result[i].imagen,
                        cantidad: productos[p].cantidad,
                        descripcion: result[i].descripcion,
                        variaciones: []
                    }
                }
    
                if(!data[ result[i].id ].variaciones[ result[i].vId ]) {

                    for(let v = 0; v < productos[p].variaciones.length; v++) {
                        const variacion = productos[p].variaciones[v]
                        if(variacion.id == result[i].vId && variacion.value == result[i].vvId) {
                            data[ result[i].id ].variaciones[ result[i].vId ] = {
                                id: result[i].vId,
                                nombre: result[i].vNombre,
                                value: result[i].vvId,
                                valueNombre: result[i].vvNombre
                            }
                            break;
                        }
                    }
                }
            }

        }
    }
    data = data.filter(i => i != null)

    for(let i = 0; i < data.length; i++) {
        data[i].variaciones = data[i].variaciones.filter(j => j != null)
    }
    res.send({code: 1, data})
})


app.get('/api/products/getAll', async (req, res) => {

    const [err, result] = await mysqlQuery(`
    SELECT *, V.nombre AS vNombre, V.id AS vId, P.descripcion AS pDescripcion, P.nombre AS pNombre, P.id AS pId, VV.valor AS vvNombre, VV.id AS vvId
            from productos P 
    LEFT JOIN variaciones V ON V.productoid = P.id 
    LEFT JOIN variaciones_value VV ON VV.variacionid = V.id
    `, [])
    if(!err) {
        let data = []

        for(let i = 0; i < result.length; i++) {
            if(!data[ result[i].pId ]) {
                data[ result[i].pId ] = {
                    id: result[i].pId,
                    nombre: result[i].pNombre,
                    precio: result[i].precio,
                    categoria: result[i].categoria,
                    imagen: result[i].imagen,
                    descripcion: result[i].pDescripcion,
                    formato: result[i].formato_de_venta,
                    disponibilidad: result[i].disponibilidad,
                    variaciones: []
                }
            }

            if(!data[ result[i].pId ].variaciones[ result[i].vId ]) {
                data[ result[i].pId ].variaciones[ result[i].vId ] = {
                    id: result[i].vId,
                    nombre: result[i].vNombre,
                    values: []
                }
            }

            data[ result[i].pId ].variaciones[ result[i].vId ].values.push({
                nombre: result[i].vvNombre,
                id: result[i].vvId
            })
        }
        data = data.filter(i => i != null)

        for(let i = 0; i < data.length; i++) {
            data[i].variaciones = data[i].variaciones.filter(j => j != null)
        }

        res.send({code: 1, data})
    }
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

    console.log("AGG")
    let { 
        nombre,
        precio,
        categoria,
        descripcion,
        formato,
        variaciones
    } = req.body
    variaciones = JSON.parse(variaciones)

    console.log(req.body)
    console.log("AGG 2")
    if(!req.files) return res.status(500).send({err: 'image is required.'})
    console.log("AGG 3")
    const img = req.files.imgs


    if(!nombre) return res.status(500).send({err: 'nombre is required.'})
    if(!precio) return res.status(500).send({err: 'precio is required.'})
    if(!categoria) return res.status(500).send({err: 'categoria is required.'})
    if(!descripcion) return res.status(500).send({err: 'descripcion is required.'})
    if(!formato) return res.status(500).send({err: 'formato is required.'})
    if(!variaciones) return res.status(500).send({err: 'variaciones is required.'})
    console.log("LLEGA ACA")


    let imagen = randomString(20)+".jpg"//generar nombre random con una funcion


    const [err, result] = await mysqlQuery(`INSERT INTO productos (nombre, precio, categoria, imagen, descripcion, formato_de_venta) VALUES (?, ?, ?, ?, ?, ?)`, [nombre, precio, categoria, imagen, descripcion, formato])

    if(err) return res.status(500).send({err: 'MySQL error #1'})
    const productId = result.insertId

    for(let i = 0; i < variaciones.length; i++) {
        const [err2, result2] = await mysqlQuery(`INSERT INTO variaciones (nombre, productoid) VALUES (?, ?)`, [variaciones[i].nombre, productId])
        if(!err2) {
            const variacionId = result2.insertId

            for(let j = 0; j < variaciones[i].options.length; j++) {
                await mysqlQuery(`INSERT INTO variaciones_value (valor, variacionid) VALUES (?, ?)`, [ variaciones[i].options[j].value, variacionId ])
            }

            img.mv(`${__dirname}/imagenes/productos/${imagen}`, (err) => {
                if(err) return console.log(err)
            })
            res.send({code: 1})
        }
    }
})

app.get('/api/products/getTop', (req, res) => {

    let data = []
    con.query(`
        SELECT *, V.nombre AS vNombre, V.id AS vId, P.nombre AS pNombre, P.id AS pId, VV.valor AS vvNombre, VV.id AS vvId
            from productos P 
        INNER JOIN variaciones V ON V.productoid = P.id 
        INNER JOIN variaciones_value VV ON VV.variacionid = V.id 
        ORDER BY P.ventas DESC LIMIT 15
    `, [], (err, result) => {
        if(err) return res.sendStatus(500)

        for(let i = 0; i < result.length; i++) {

            const productoId = data.findIndex(j => j.id == result[i].pId)

            let variaciones = {
                id: result[i].vId,
                nombre: result[i].vNombre,
                values: []
            }

            if(productoId == -1) {
                data.push({
                    id: result[i].pId,
                    nombre: result[i].pNombre,
                    precio: result[i].precio,
                    imagen: result[i].imagen,
                    descripcion: result[i].descripcion,
                    formato: result[i].formato_de_venta,
                    variaciones: [{
                        id: result[i].vId,
                        nombre: result[i].vNombre,
                        values: [{
                            nombre: result[i].vvNombre,
                            id: result[i].vvId
                        }]                       
                    }]
                })
            } else {
                const variacionId = data[ productoId ].variaciones.findIndex(j => j.id == result[i].pId)
                if(variacionId == -1) {
                    data[ productoId ].variaciones.push({
                        id: result[i].vId,
                        nombre: result[i].vNombre,
                        values: [{
                            nombre: result[i].vvNombre,
                            id: result[i].vvId
                        }]   
                    })
                } else {
                    data[ productoId ].variaciones[ variacionId ].values.push({
                        nombre: result[i].vvNombre,
                        id: result[i].vvId
                    })
                }
            }
        }
        res.send({code: 1, data})
    })
})


/* CATEGORIAS */

app.get('/api/categories/get', async (req, res) => {
    const [err, result] = await mysqlQuery(`SELECT C.*, (SELECT COUNT(*) FROM productos p WHERE p.categoria = C.id) as productos FROM categorias C `)
    if(err) {
        return res.status(500).send({err: 'MySQL error'})
    }
    res.send({code: 1, data: result})
})

app.get('/api/categories/getAllWithProducts', async (req, res) => {

    const [err, result] = await mysqlQuery(`
    SELECT P.*,
                
                V.*,
                VV.*,
                V.nombre AS vNombre,
                V.id AS vId,
                P.nombre AS pNombre,
                P.id AS pId,
                VV.valor AS vvNombre,
                VV.id AS vvId,
                C.id AS categoriaID,
                C.nombre AS categoriaNombre
    
                from categorias C 
    
                LEFT JOIN productos P ON C.id = P.categoria
                LEFT JOIN variaciones V ON V.productoid = P.id 
                LEFT JOIN variaciones_value VV ON VV.variacionid = V.id
    `)
    if(err) return res.status(500).send({error: 'mysql error'})

    let data = []

    for(let i = 0; i < result.length; i++) {
        if(!data[ result[i].categoriaID ]) {
            data[ result[i].categoriaID ] = {
                id: result[i].categoriaID,
                nombre: result[i].categoriaNombre,
                productos: []
            }
        }

        if(!data[ result[i].categoriaID ].productos[ result[i].pId ]) {
            data[ result[i].categoriaID ].productos[ result[i].pId ] = {
                id: result[i].pId,
                nombre: result[i].pNombre,
                precio: result[i].precio,
                categoria: result[i].categoria,
                imagen: result[i].imagen,
                descripcion: result[i].descripcion,
                formato: result[i].formato_de_venta,
                disponibilidad: result[i].disponibilidad,
                variaciones: []
            }
        }

        if(!data[ result[i].categoriaID ].productos[ result[i].pId ].variaciones[ result[i].vId ]) {
            data[ result[i].categoriaID ].productos[ result[i].pId ].variaciones[ result[i].vId ] = {
                id: result[i].vId,
                nombre: result[i].vNombre,
                values: []
            }
        }

        data[ result[i].categoriaID ].productos[ result[i].pId ].variaciones[ result[i].vId ].values.push({
            nombre: result[i].vvNombre,
            id: result[i].vvId
        })
    }
    data = data.filter(i => i != null)
    for(let i = 0; i < data.length; i++) {
        data[i].productos = data[i].productos.filter(j => j != null)
        for(let k = 0; k < data[i].productos.length; k++) {
            data[i].productos[k].variaciones = data[i].productos[k].variaciones.filter(b => b != null)
        }
    }
    res.send({code: 1, data})
})

app.post('/api/categories/delete', async (req, res) => {

    const { id } = req.body;
    if(!id) return res.status(500).send({err: 'id is required'})

    const [err, result] = await mysqlQuery("DELETE FROM categorias WHERE id = ?", [id])
    if(err) return res.status(500).send({err: 'MySQL error'})
    res.send({code: 1})
})

app.post('/api/categories/add', async (req, res) => {

    const { nombre, subcat } = req.body

    if(!nombre) return res.status(500).send({err: 'nombre is required'})
    if(!subcat) return res.status(500).send({err: 'subcat is required'})

    const [err, result] = await mysqlQuery('INSERT INTO categorias (nombre, subcat) VALUES (?, ?)', [nombre, subcat])
    if(err) return res.status(500).send({err: 'MySQL error'})
    res.send({code: 1})
})

app.post('/api/categories/edit', async (req, res) => {
    const { id, nombre } = req.body
    if(!nombre) return res.status(500).send({err: 'nombre is required'})
    if(!id) return res.status(500).send({err: 'id is required'})

    await mysqlQuery("UPDATE categorias set nombre = ? WHERE id = ? ", [nombre, id])
    if(err) return res.status(500).send({err: 'MySQL error'})
    res.send({code: 1})
})

function randomString(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


function mysqlQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        con.query(query, [...params], (err, result) => {
            resolve([err, result])
        })
    })
}

async function crear_compra(productos, nombre, tel, dire, ciudad, formaPago, formaEnvio) {
    if(!tel) return 1;
    if(!dire) return 1;

    //productos = JSON.parse(productos)

    const fecha = new Date;

    let pagado = 0;

    if(formaPago == 0) pagado = 1;


    const [err, result] = await mysqlQuery(`
        INSERT INTO
            pedidos
        (nombre, telefono, direccion, ciudad, pago, fecha, enviar, enviado, pagado)
            VALUES
        (?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [
        nombre,
        tel,
        dire,
        ciudad,
        formaPago,
        fecha,
        formaEnvio,
        pagado
    ])
    if(err) return false

    const idpedido = result.insertId


    for(let i = 0; i < productos.length; i++) 
    {
        const [err2, result2] = await mysqlQuery(`
            INSERT INTO
                pedidos_productos
            (pedidoid, productoid, cantidad)
                VALUES
            (?, ?, ?)`,
            [
                idpedido,
                productos[i].id,
                productos[i].cantidad
            ])
        if(err2) return false


        const idpedidop = result2.insertId;
        
        for(let j = 0; j < productos[i].variaciones.length; j++) 
        {
            await mysqlQuery(`
                INSERT INTO
                    pedidos_variaciones
                (pedidoid, productoid, pedidoproducto, variacionid, valor)
                    VALUES
                (?, ?, ?, ?, ?)
            `, [
                idpedido,
                productos[i].id,
                idpedidop,
                productos[i].variaciones[j].id,
                productos[i].variaciones[j].value,
            ])                   
        }
    }
}