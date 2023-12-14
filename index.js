const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');
const path = require('path');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const https = require('https');
const http = require('http')
const fs = require('fs');
const { Server } = require("socket.io");

const mercadoPago = new MercadoPagoConfig({ accessToken: 'APP_USR-7444149544855350-041318-39a02366ca6157a357d9a705552f4555-200576816', options: { timeout: 5000, idempotencyKey: 'abc' } });



const app = express()


app.use(fileUpload());
app.use(bodyParser.json({ limit: '80mb' }))
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: false,
}))
app.use(express.static('imagenes'));
app.use(cors(/*{origin:['http://localhost', 'http://localhost:3000', 'https://pruebatutto.alebike.online'], credentials:true}*/));


const PORT = process.env.PORT || 2053;

app.set('PORT', PORT)

const privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCowa9J1OwdzazY
GkDc0DdnDVpFrXi33SI6QuV3ApLnsmV+W+ehVCvZADGXLtI4/a8XilVqC8ifxxRA
m8uftBfTHM3YaGIzNqvrOfkyZ3TwGZp72uPRus3W/PiODejneE+XAYmDFhqN1bjl
Gu8846b2HFEKcv0DpZhrhFGUIqWBn7jaZJ6fOn3vLOHlzUhdIE7uM2nhx0zj8yH3
B/IYCbvTtMNFBju/hkEvHIqbYHNRKXFgTf2JzcNsS5gFSKPrFi4f4PhT1aBy9KTf
gVIYzO3EfeXkStXE4C+4JVqqgevDNFCvCsAbcQnGEymf4WWRXsrCJ9FKWyU1Jw7i
ronM6pf9AgMBAAECggEAE2CcFVT84MY1ZuIK2SASgIOEvlP3NNuQOtLkINh7kF3I
cCwy6nAtEb+HMjYm3vLoOEKC4MimGoykO2/4P2gRRUU9MLB5uCo6rumq/tno0EoM
VlTxzGsQCDPngX5A5FVJBEyhotr2pRspnisL1fjI+uERACtoeJL677uTl3gr+3hw
9pKhS3DBdygVmYDFFkIbi9DV8Zo/0vFumlkvKEN6++J0us2STg9vnAAMwrs4wgeu
hu6A2PEKS1RJfsqlndJk0/2TIHUTYzBc6pfdH4dvFBVAWQs3ywPED7l723UVtqXw
zfkGNJBYOoxu2GoypNzypXscu+17jiwrVbSb/6EFEQKBgQDjfqsJhrnv3a5l8qqJ
6y1HW2EgC1KuLBrfuUjiXNGVYJBWHaMYEUz8NXZlP4dy01da1BL90TO9RriAqMcH
LhkSZUlG3N0+diFYNT7bM6xalUb0vbZ5l7RWnmlJDB5QFv5SEPwHrI8f39s3Wx8o
PSEdfENOXsdQ9l2+4K7N1z6EzQKBgQC95uAsOMr1EDDwJ66kqGyAGKNviok4i2ys
N5z5c2alPhEF9R9r2NL16uwFKtx2tO7kPRWt5jUq0KKm/pwMSXXjEOSfbNe/O45Z
KPQATyLrKA84CS0x8VSILbpHsY+HcMq1m4U6Nj1NwbGgcQhiY/aGtOVLhxqjPpDt
Fdv9kuXf8QKBgCyr4eAUAYz1ZdqFBTHh6Vk6u160en7TEE/gLUyt10XS2WTfmvgN
5aUcxmvpRqqoj125iSUoIFXJfk9dVP+28JtpIjN1CUjLn46XngkjI3QCHhXO7vb/
cB0WLCx44bbuXPA2f5buLoiex4geL4cSQd9tWDYabF8ckZn6uriWzKL9AoGAH5iC
Q9lPK2b+PXbcv9il9MokpzJNknLgKec23uosceHZwzv9dlwk/XWQv2taMwX3mVHw
gXaD8hO0fERwgjrWumjdIQli/BZUoNEHh+Wi0a1gmtosAts8TUwOak9IqihCEeVG
TWEo4f8QJrmnw3cOVWtTmzVnYTHPuyKf75i5VoECgYB+M6CKwSYh7phmcNIEL64x
mlIz1zVWLbq6Cgw6VJCmXfwHVRZrabJv0a2DvFjWrZXYUoKww5cxj0QECJaQWviW
zxHfsmgR02HcERpPOZzVOiJeNNS0tMsy4ga5aK31thDeOCq9op4BzSgAoN1s3U9H
IHNK3fUFPXQMV3IiZMKuHQ==
-----END PRIVATE KEY-----
`
const certificate = `-----BEGIN CERTIFICATE-----
MIIEFTCCAv2gAwIBAgIUDZscYH3ICozDYyWh46yuFenW+F0wDQYJKoZIhvcNAQEL
BQAwgagxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRYwFAYDVQQH
Ew1TYW4gRnJhbmNpc2NvMRkwFwYDVQQKExBDbG91ZGZsYXJlLCBJbmMuMRswGQYD
VQQLExJ3d3cuY2xvdWRmbGFyZS5jb20xNDAyBgNVBAMTK01hbmFnZWQgQ0EgODU5
MzBmNjE2MjExNzBiZTZmNjA3NGZiYmEwYzBlN2QwHhcNMjMxMjA1MjI1NzAwWhcN
MzMxMjAyMjI1NzAwWjAiMQswCQYDVQQGEwJVUzETMBEGA1UEAxMKQ2xvdWRmbGFy
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAKjBr0nU7B3NrNgaQNzQ
N2cNWkWteLfdIjpC5XcCkueyZX5b56FUK9kAMZcu0jj9rxeKVWoLyJ/HFECby5+0
F9MczdhoYjM2q+s5+TJndPAZmnva49G6zdb8+I4N6Od4T5cBiYMWGo3VuOUa7zzj
pvYcUQpy/QOlmGuEUZQipYGfuNpknp86fe8s4eXNSF0gTu4zaeHHTOPzIfcH8hgJ
u9O0w0UGO7+GQS8ciptgc1EpcWBN/YnNw2xLmAVIo+sWLh/g+FPVoHL0pN+BUhjM
7cR95eRK1cTgL7glWqqB68M0UK8KwBtxCcYTKZ/hZZFeysIn0UpbJTUnDuKuiczq
l/0CAwEAAaOBuzCBuDATBgNVHSUEDDAKBggrBgEFBQcDAjAMBgNVHRMBAf8EAjAA
MB0GA1UdDgQWBBR3/YQ2tf1LBzhv4BtGtGGt8WtUPjAfBgNVHSMEGDAWgBS6rsqY
cig4HrdnWspq+H7lVMr3rDBTBgNVHR8ETDBKMEigRqBEhkJodHRwOi8vY3JsLmNs
b3VkZmxhcmUuY29tLzYwZGE1MDliLWU2YjUtNDQ2My1hNjI0LTA5ZWZhMzZkNGRh
Yy5jcmwwDQYJKoZIhvcNAQELBQADggEBAKatlcrFdhiEx0gIaZbJ4/PJBGYJfToO
hjYkQU+6n2csF5kqYRLuyFT0R4oo8LnWYHP+odrr6egjR5+vVBGvWxT9WoM8pV1z
w1YppVoZDdMINZk0K/daiv47NszwmMwq+3Qm/Txyt0dUY0gfPPCPMpU9a2Ub8qfX
Zl09RXCfeoTPHPwTQQmrD2i+QNxLg6FI5bXims+6CxQKaWNWB+z98bv+cycNicMK
TmECvhVkKi4p5J0RxW/e/nCOxKVTKNyvrtN3aa78PQTH6/tnUaD9DMXWz6jSuUzQ
LgSlVP7WIUypdkIm80ybzL7KbbpWC/nBhYMEl/NsTDQfJuVTF1v8aGU=
-----END CERTIFICATE-----
`

const credentials = { key: privateKey, cert: certificate };


 //const credentials = {} 


const server = https.createServer(credentials, app);

const io = new Server(server ,{
    cors: {
        origin: ['http://localhost:3000', 'https://pastastuttobene.com', 'http://localhost'],
        credentials: true
    },
    allowEIO3: true
});


var con = mysql.createPool({
    connectionLimit: 10,
    host:'localhost',
    database:'tuttobene',
    user:'tino',
    password:'tinovalen123'
});

/*const con = mysql.createConnection({
    host:'localhost',
    database:'tuttobene',
    user:'root',
    password:''
})*/

con.query("SELECT id FROM productos LIMIT 1", function (err, rows, fields) {
    if (err) {
        console.log('Hubo un error con la conexion a la base de datos!');
        console.log(err);
    } else {
        console.log("Conexion con la base de datos exitosa!");
    }
});

/*con.connect(function(err) {
    if (err) throw err;
    console.log("Base de datos conectada!");
});*/


app.get('/imagenes/productos/:img', function(req, res){
    res.sendFile( `${__dirname}/imagenes/productos/${req.params.img}` );
});

/* HORARIOS */

app.post('/api/horarios/save', async (req, res) => {
    const {
        dias
    } = req.body;
    if(!dias) return res.sendStatus(500);

    for(let i = 0; i < dias.length; i++) {
        await mysqlQuery(`DELETE FROM horarios_rangos WHERE horario_id = ?`, [dias[i].id]);
        
        for(let j = 0; j < dias[i].horarios.length; j++) {
            await mysqlQuery(`INSERT INTO horarios_rangos (horario_id, desde, hasta) VALUES (?, ?, ?)`, [dias[i].id, dias[i].horarios[j].desde, dias[i].horarios[j].hasta]);
        }
    }

    

    res.send({code: 1})
})

app.get('/api/horarios/get', async (req, res) => {

    const [err, result] = await mysqlQuery(`SELECT H.*, HR.id AS idH, HR.desde, HR.hasta FROM horarios H LEFT JOIN horarios_rangos HR ON HR.horario_id = H.id`);
    if(err) return res.sendStatus(500);

    let data = [];

    for(let i = 0; i < result.length; i++) {
        if(!data[ result[i].dia ]) {
            data[ result[i].dia ] = {
                id: result[i].id,
                dia: result[i].dia,
                nombreDia: result[i].nombreDia,
                horarios: []
            }
        }
        if(result[i].desde) {

            data[ result[i].dia ].horarios.push({
                id: result[i].idH,
                desde: result[i].desde,
                hasta: result[i].hasta
            })
        }
    }
    res.send({code: 1, data});
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

    if(!token) return res.status(500).send({err: 'token is required.'})

    const [err, result] = await mysqlQuery(`SELECT * FROM sesiones S INNER JOIN usuarios U ON U.id = S.usuario WHERE S.token = ? LIMIT 1`, [token])
    if(err) return res.status(500).send({err: 'MySQL error.'})

    if(result.length > 0) {
        res.send({code: 1, data: result[0]})
    } else {
        res.send({code: 0})
    }
})

/* PEDIDOS */

app.get('/api/admin/pedidos-cerrados', async (req, res) => {

    let data = []
    const [err, result] = await mysqlQuery(`
        SELECT 
                P.*,
                PP.*,
                VVD.valor AS VariacionValueNombre,
                VD.nombre AS VariacionNombre,
                PV.variacionid AS VariacionId,
                PV.valor AS VariacionValor,
                PS.nombre AS nombreProducto,
                PS.precio AS precioProducto,
                PS.formato_de_venta AS formatoProducto,
                P.id AS idPedido,
                PP.id AS PProductoId,
                PV.id AS PVarId
            FROM pedidos P
            LEFT JOIN pedidos_productos PP ON PP.pedidoid = P.id
            LEFT JOIN productos PS ON PS.id = PP.productoid
            LEFT JOIN pedidos_variaciones PV ON PV.pedidoid = P.id AND PV.pedidoproducto = PP.id
            LEFT JOIN variaciones VD ON VD.id = PV.VariacionId
            LEFT JOIN variaciones_value VVD ON VVD.id = PV.valor
            WHERE P.enviado = 1
            ORDER BY P.id DESC
        `)
    if(err) return res.status(500).send({err: 'MySQL error.'})
    for(let i = 0; i < result.length; i++) {

        if(!data[ result[i].idPedido ]) {
            data[ result[i].idPedido ] = {
                telefono: result[i].telefono,
                nombre: result[i].nombre,
                id: result[i].idPedido,
                direccion: result[i].direccion,
                ciudad: result[i].ciudad,
                pago: result[i].pago,
                pagado: result[i].pagado,
                enviar: result[i].enviar,
                enviado: result[i].enviado,
                fecha: result[i].fecha,
                productos: []
            }
        }

        if(!data[ result[i].idPedido ].productos[ result[i].PProductoId ]) {
            data[ result[i].idPedido ].productos[ result[i].PProductoId ] = {
                cantidad: result[i].cantidad,
                productoid: result[i].productoid,
                nombre: result[i].nombreProducto,
                precio: result[i].precioProducto,
                formato: result[i].formatoProducto,
                variaciones: []
            }
        }

        if(!data[ result[i].idPedido ].productos[ result[i].PProductoId ].variaciones[ result[i].VariacionId ]) {
            data[ result[i].idPedido ].productos[ result[i].PProductoId ].variaciones[ result[i].VariacionId ] = {
                id: result[i].VariacionId,
                nombre: result[i].VariacionNombre,
                value: result[i].VariacionValor,
                valueNombre: result[i].VariacionValueNombre
            }
        }
    }

    data = limpiar_array(data)

    res.send({code: 1, data})
})

app.post('/api/admin/pedido-enviado', async (req, res) => {

    const { id } = req.body
    if(!id) return res.status(500).send({err: 'id is required.'})

    await mysqlQuery('UPDATE pedidos SET enviado=1 WHERE id=?')
    res.send({code: 1})
})

app.get('/api/pedidosEnviadosInfo', async(req, res) => {
    const { token } = req.body
    console.log(req.body)
    const [err, result] = await mysqlQuery(` SELECT * FROM pedidos WHERE tokenPedido = ? LIMIT 1;`, token)
    console.log(result)
})

app.post('/api/pedidos/changeState', async(req, res) => {
    const { pedido, estado } = req.body

    if(!pedido) return res.sendStatus(500).send({err_msg: 'pedido is required.'})
    if(!estado) return res.sendStatus(500).send({err_msg: 'estado is required.'})

    let enviado = 0

    if(estado == 3) enviado = 1

    const [err, result] = await mysqlQuery(`UPDATE pedidos SET estado = ?, enviado = ? WHERE id = ?`, [estado, enviado, pedido])
    if(err) return res.sendStatus(500).send({err_msg: 'MySQL error #1'})
    
    io.emit('pedido:changeState', {pedido, estado, enviado})
    res.send({code: 1, enviado})
})

app.get('/api/admin/pedidos', async(req, res) => {

    const { mayor } = req.params

    let query_mayor = " "

    if(mayor) {
        query_mayor = ` AND P.id > ${mayor} `;
    }

    const [err, result] = await mysqlQuery(`
    SELECT 
        P.*,
        PP.*,
        VVD.valor AS VariacionValueNombre,
        VD.nombre AS VariacionNombre,
        PV.variacionid AS VariacionId,
        PV.valor AS VariacionValor,
        PS.nombre AS nombreProducto,
        PS.precio AS precioProducto,
        PS.formato_de_venta AS formatoProducto,
        PS.imagen AS imagen,
        P.id AS idPedido,
        PP.id AS PProductoId,
        PV.id AS PVarId
    FROM pedidos P
        LEFT JOIN pedidos_productos PP ON PP.pedidoid = P.id
        LEFT JOIN productos PS ON PS.id = PP.productoid
        LEFT JOIN pedidos_variaciones PV ON PV.pedidoid = P.id AND PV.pedidoproducto = PP.id
        LEFT JOIN variaciones VD ON VD.id = PV.VariacionId
        LEFT JOIN variaciones_value VVD ON VVD.id = PV.valor
    WHERE P.enviado = 0 ${query_mayor}
`)
    if(err) return res.status(500).send({err: 'MySQL error.'})
    let data = []
    console.log(result)

    for(let i = 0; i < result.length; i++) {

        if(!data[ result[i].idPedido ]) {
            data[ result[i].idPedido ] = {
                telefono: result[i].telefono,
                nombre: result[i].nombre,
                id: result[i].idPedido,
                direccion: result[i].direccion,
                ciudad: result[i].ciudad,
                pago: result[i].pago,
                pagado: result[i].pagado,
                enviar: result[i].enviar,
                enviado: result[i].enviado,
                fecha: result[i].fecha,
                total: result[i].total,
                estado: result[i].estado,
                productos: []
            }
        }

        if(!data[ result[i].idPedido ].productos[ result[i].PProductoId]) {
            data[ result[i].idPedido ].productos[ result[i].PProductoId] = {
                cantidad: result[i].cantidad,
                productoid: result[i].productoid,
                nombre: result[i].nombreProducto,
                precio: result[i].precioProducto,
                formato: result[i].formatoProducto,
                imagen: result[i].imagen,
                variaciones: []
            }
        }

        if(!data[ result[i].idPedido ].productos[ result[i].PProductoId].variaciones[ result[i].VariacionId ]) {
            data[ result[i].idPedido ].productos[ result[i].PProductoId].variaciones[ result[i].VariacionId ] = {
                id: result[i].VariacionId,
                nombre: result[i].VariacionNombre,
                value: result[i].VariacionValor,
                valueNombre: result[i].VariacionValueNombre
            }
        }
    }
    data = limpiar_array(data)
    data = data.reverse()
    res.send({code: 1, data})
})

function limpiar_array(array) {
    if(Array.isArray(array)) {
        array = array.filter(i => i != null)

        for(let i = 0; i < array.length; i++) {

            const objects = Object.keys(array[i])

            for(let j = 0; j < objects.length; j++) {

                if(Array.isArray(array[i][objects[j]]) || typeof array[i][objects[j]] == "object") {
                    array[i][objects[j]] = limpiar_array(array[i][objects[j]])
                }
            }

        }
    } else if(typeof array == "object") {
        if(array == null) return null//hay q ver q onda con esto
        const objects = Object.keys(array)
        for(let i = 0; i < objects.length; i++) {
            if(typeof objects[i] == "object") {
                objects[i] = limpiar_array(objects[i])
            }
        }
    }
    return array
}

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
        crear_compra(
            productos,
            nombre,
            telefono,
            direccion,
            ciudad,
            1,
            1
        );
    } else {
        crear_compra(
            productos,
            nombre,
            telefono,
            '-',
            '-',
            1,
            0
        );
    }
    res.send({code: 1})
})

app.post('/api/recibir-pedido', async (req, res) => {

    const { type } = req.query

    console.log(req.query)

    console.log("recibido")
    if(type == "payment") {
        console.log("payment")
        console.log("dataid: "+req.query['data.id'])

        const payment = new Payment(mercadoPago);

        payment.get({id: req.query['data.id']}).then((response) => {
            const data = response
            console.log("RESPONSEEE")
            console.log(response)
            if(data.status == 'approved') {
                    const enviodata = data.metadata
                    const productos = enviodata.productos
                    console.log(productos)


                    crear_compra(
                        JSON.parse(productos),
                        enviodata.nombre,
                        enviodata.telefono,
                        enviodata.direccion,
                        enviodata.ciudad,
                        enviodata.forma_pago,
                        enviodata.forma_envio
                    )

            }
        }).catch(err => {
            console.log(err)
        })
    }

    res.send({code: 1})
})

app.post('/api/pedidos/gets', async(req, res) => {
    const { pedidos } = req.body

    if(!pedidos) return res.statusCode(500).send({err_msg: 'pedidos is required.'})

    let dataResult = []

    for(let i = 0; i < pedidos.length; i++) {
        const [err, result] = await mysqlQuery(`
            SELECT
                P.*,
                (SELECT COUNT(*) FROM pedidos_productos PP WHERE PP.pedidoid = P.id ) AS cantproductos,
                (SELECT PRO.imagen FROM pedidos_productos PP INNER JOIN productos PRO ON PRO.id = PP.productoid WHERE PP.pedidoid = P.id LIMIT 1) AS imagen
            FROM pedidos P
            WHERE P.codigo = ?
            LIMIT 1`, [pedidos[i]])
        if(!err) {
            if(result.length > 0) dataResult.push({...result[0]})
        }
    }
    res.send({code: 1, data: dataResult})
})

app.post('/api/pedidos/get', async(req, res) => {

    const { codigo } = req.body
    if(!codigo) return res.statusCode(500).send({err_msg:'codigo is required.'})

    const [err, result] = await mysqlQuery(`SELECT * FROM pedidos P WHERE P.codigo = ?`, [codigo])
    if(err) return res.statusCode(500).send({err_msg:'MySQL error #1'})

    //console.log(result)
    if(result.length == 0) {
        res.send({code: 0})
    } else {

        let data = {
            ...result[0],
            productos: []
        }

        const [errP, resultP] = await mysqlQuery(`SELECT * FROM pedidos_productos WHERE pedidoid = ?`, [result[0].id])
        if(!errP) {

            if(resultP.length > 0) {
                for(let i = 0; i < resultP.length; i++) {

                    /* CADA PRODUCTO - EACH PRODUCT */
    
                    const [errPP, resultPP] = await mysqlQuery(`
                    SELECT
                        P.*,
                        PV.variacionid,
                        PV.valor,
                        V.nombre AS variacionNombre,
                        VV.valor
                    FROM 
                    productos P

                    INNER JOIN pedidos_variaciones PV ON PV.pedidoproducto = ?
                    INNER JOIN variaciones V ON V.id = PV.variacionid
                    INNER JOIN variaciones_value VV ON VV.id = PV.valor
                    WHERE P.id = ?
                    `, [resultP[i].id, resultP[i].productoid])
                    if(!errPP) {
                        if(resultPP.length > 0) {

                            let variaciones = []

                            for(let j = 0; j < resultPP.length; j++) {
                                variaciones.push({nombre: resultPP[j].variacionNombre, valor: resultPP[j].valor})
                            }

                            delete resultPP[0].variacionNombre;
                            delete resultPP[0].valor
                            delete resultPP[0].variacionid


                            data.productos.push({...resultPP[0], cantidad: resultP[i].cantidad, variaciones})
                        }
                    }
                }
            }

        }

        res.send({code: 1, data})
    }
})


app.post('/api/pedidos/send', async(req, res) => {

    let {
        formaPago,// 0 = mercadoPago | 1 = Efectivo
        formaEnvio,// 1 = Domicilio | 0 = Local
        productos,
        nombre,
        telefono,
        direccion,
        ciudad,
        tokenPedido // llega el nombre del token para identificar le pedido en la bd
    } = req.body
    


    productos = JSON.parse(productos);

    if(formaPago == 0) {

        let items = []

        for(let i = 0; i < productos.length; i++) {
            items.push({
                id: productos[i].id.toString(),
                title: productos[i].nombre,
                description: productos[i].descripcion,
                quantity: productos[i].cantidad,
                unit_price: productos[i].precio,
                currency_id: 'ARS'
            })
        }

        var payment_data = {
            //transaction_amount: 100,
            //token: 'ff8080814c11e237014c1ff593b57b4d',
            installments: 1,
            items: items,
            description:"Tutto Bene",
            metadata: {
                nombre: nombre,
                direccion: direccion,
                ciudad: ciudad,
                telefono: telefono,
                formaEnvio: formaEnvio,
                formaPago: formaPago,
                productos: JSON.stringify(productos)
            },
            auto_return:'approved',
            back_urls: {
                success: 'https://tuttobene.online:2053/api/recibir-pedido'
            },
            notification_url: 'https://tuttobene.online:2053/api/recibir-pedido',
            installments: 1,
            payer: {
                name: nombre,
              type: "customer",
              id: "123456789-jxOV430go9fx2e"
            },
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 1
            }
            //notification_url: "http://localhost:3001/api/"
            
          };


          const preference = new Preference(mercadoPago);
          
          preference.create({body: payment_data}).then(function (data) {
            console.log("DEVUELVEE")
            console.log(data)
            res.send({code: 1, preference_id: data.id})
          }).catch(err => {
            console.log(err)
          })

    } else {
        const codigo = await crear_compra(
            productos,
            nombre,
            telefono,
            direccion,
            ciudad,
            formaPago,
            formaEnvio
        )
        console.log("codigo: ")
        console.log(codigo)
        res.send({code: 1, codigo})
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
    let { 
        nombre,
        precio,
        categoria,
        descripcion,
        formato,
        disponibilidad,
        id,
        imagen,
        variaciones
     } = req.body

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
            nombre,
            precio,
            categoria,
            descripcion,
            formato,
            disponibilidad,
            id
    ])

    if(req.files) {
        if(req.files['img']) {
            req.files['img'].mv(`${__dirname}/imagenes/productos/${imagen}`, (err) => {
                if(err) return console.log(err)
            })
        }
    }

    variaciones = JSON.parse(variaciones)

    console.log(variaciones)

        for(let i = 0; i < variaciones.length; i++) {
            if(variaciones[i] == null) continue;
            await mysqlQuery(`
                UPDATE
                    variaciones
                SET
                    nombre= ?,
                    productoid= ?
                WHERE 
                    id= ?
                `, [
                    variaciones[i].nombre,
                    id,
                    variaciones[i].id,
            ])

            for(let j = 0; j < variaciones[i].values.length; j++) {

                let borrado = false
                if(variaciones[i].values[j].borrado == 1) {
                    await mysqlQuery(`DELETE FROM variaciones_value WHERE id = ?`, [variaciones[i].values[j].id])
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
                        variaciones[i].values[j].nombre,
                        variaciones[i].id,
                        variaciones[i].values[j].id,
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

    for(let p = productos.length - 1; p >= 0; p--) {
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

            let info = null

            for(let i = 0; i < result.length; i++) {
                if(info == null) {
                    info = {
                        id: result[i].id,
                        nombre: result[i].nombre,
                        precio: result[i].precio,
                        imagen: result[i].imagen,
                        cantidad: productos[p].cantidad,
                        descripcion: result[i].descripcion,
                        variaciones: []
                    }
                }
    
                if(!info.variaciones[ result[i].vId ]) {

                    for(let v = 0; v < productos[p].variaciones.length; v++) {
                        const variacion = productos[p].variaciones[v]
                        if(variacion.id == result[i].vId && variacion.value == result[i].vvId) {
                            info.variaciones[ result[i].vId ] = {
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
            data.push(info)

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
    con.query(`DELETE FROM productos WHERE id = ?`, [id], (err, result) => {
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


    const [err, result] = await mysqlQuery(`INSERT INTO productos (nombre, precio, categoria, imagen, descripcion, formato_de_venta, ventas) VALUES (?, ?, ?, ?, ?, ?, 0)`, [nombre, precio, categoria, imagen, descripcion, formato])

    if(err) return res.status(500).send({err: 'MySQL error #1', msg: err})
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
        }
    }
    res.send({code: 1})
})

app.get('/api/products/getTop', async (req, res) => {


    const [err, result] = await mysqlQuery(`
        SELECT *, V.nombre AS vNombre, V.id AS vId, P.nombre AS pNombre, P.id AS pId, VV.valor AS vvNombre, VV.id AS vvId
            from productos P 
        LEFT JOIN variaciones V ON V.productoid = P.id 
        LEFT JOIN variaciones_value VV ON VV.variacionid = V.id 
        ORDER BY P.ventas DESC LIMIT 15
    `)
    let data = []
    if(!err) {

        for(let i = 0; i < result.length; i++) {

            if(!data[ result[i].pId ]) {
                data[ result[i].pId ] = {
                    id: result[i].pId,
                    nombre: result[i].pNombre,
                    precio: result[i].precio,
                    imagen: result[i].imagen,
                    descripcion: result[i].descripcion,
                    formato: result[i].formato_de_venta,
                    disponibilidad:1,
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
    }

    console.log(data)

    res.send({code: 1, data: limpiar_array(data)})
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
    console.log("id: " + id)

    const [err, result] = await mysqlQuery("DELETE FROM categorias WHERE id = ?", [id])
    /* if(err) return res.status(500).send({err: 'MySQL error'}) */
    res.send({code: 1})
})

app.post('/api/categories/add', async (req, res) => {

    const { nombre, subcat } = req.body

    if(!nombre) return res.status(500).send({err: 'nombre is required'})
    if(subcat == null) return res.status(500).send({err: 'subcat is required'})

    const [err, result] = await mysqlQuery('INSERT INTO categorias (nombre, subcat) VALUES (?, ?)', [nombre, subcat])
    if(err) return res.status(500).send({err: 'MySQL error'})
    res.send({code: 1})
})

app.post('/api/categories/edit', async (req, res) => {
    const { id, nombre } = req.body
    if(!nombre) return res.status(500).send({err: 'nombre is required'})
    if(!id) return res.status(500).send({err: 'id is required'})

    const sql = await mysqlQuery("UPDATE categorias set nombre = ? WHERE id = ? ", [nombre, id])
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
    //formaPago 0 = mercadoPago | 1 = Efectivo
    //formaEnvio 1 = Domicilio | 0 = Local

    console.log("Crear compra")
    if(!tel) return 1;
    if(!dire) return 1;
    console.log("# crear_compra()")

    //productos = JSON.parse(productos)

    const fecha = Date.now();

    let pagado = 0;

    if(formaPago == 0) pagado = 1;

    let total = 0;

    for(let i = 0; i < productos.length; i++) {
        total += productos[i].precio * productos[i].cantidad
    }
//ALTER TABLE `pedidos` ADD `total` INT NOT NULL AFTER `codigo`;

    const [err, result] = await mysqlQuery(`
        INSERT INTO
            pedidos
        (nombre, telefono, direccion, ciudad, pago, fecha, enviar, enviado, pagado, total)
            VALUES
        (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `, [
        nombre,
        tel,
        dire,
        ciudad,
        formaPago,
        fecha,
        formaEnvio,
        pagado,
        total
    ])
    if(err) return console.log(err)

    const idpedido = result.insertId

    const codigo = `${idpedido}${Date.now()}`

    await mysqlQuery(`UPDATE pedidos SET codigo = ? WHERE id = ?`, [codigo, idpedido])


    for(let i = 0; i < productos.length; i++) 
    {
        const [err2, result2] = await mysqlQuery(`
            INSERT INTO
                pedidos_productos
            (pedidoid, productoid, cantidad, precio)
                VALUES
            (?, ?, ?, ?)`,
            [
                idpedido,
                productos[i].id,
                productos[i].cantidad,
                productos[i].precio
            ])
        if(err2) return console.log(err2)


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

    
    io.emit('compra:create', {nombre, telefono: tel, direccion: dire, ciudad, pago: formaPago, enviar: formaEnvio, id: idpedido, total, pagado, fecha, estado: 0, productos, enviado: 0})
    return codigo
}

server.listen(app.get('PORT'), () => {
    console.log(`Server listening on port ${app.get('PORT')}...`)
})