const express = require('express')
const methodOverride = require('method-override')
const expressLayouts = require('express-ejs-layouts')

const {
  body,
  validationResult,
  check
} = require('express-validator')

const session = require("express-session")
const cookieParser = require("cookie-parser")
const flash = require("connect-flash")

require("./utils/db")
const Contact = require('./model/Contact')

const app = express()
const port = 3000

app.use(methodOverride('_method'))

app.listen(port, () => {
  console.log(`Berjalan di port ${port}`)
})

app.use(express.static("./public"))
app.use(express.urlencoded({
  extended: true
}))

app.set("view engine", 'ejs')
app.use(expressLayouts)


app.use(cookieParser('secret'))
app.use(
  session({
    cookie: {
      maxAge: 6000
    },
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
)
app.use(flash())

app.get('/', (req, res) => {
  res.render('index', {
    layout: "layout/mainLayout",
    title: "Halaman index"
  })
})

app.get('/about', (req, res) => {
  res.render('about', {
    layout: "layout/mainLayout",
    title: "Halaman about"
  })
})

app.get('/contact', async (req, res) => {
  const contacts = await Contact.find()
  res.render('contact', {
    layout: "layout/mainLayout",
    title: "Halaman kontak",
    contacts,
    msg: req.flash('msg')
  })
})

app.get('/contact/add', (req, res) => {
  res.render('add-contact', {
    layout: "layout/mainLayout",
    title: "Halaman tambah kontak",
  })
})

// Prosses tambah kontak
app.post('/contact', [
  body('nama').custom(async (value) => {
    const duplikat = await Contact.findOne({
      nama: value
    })
    if (duplikat) {
      throw new Error("Nama sudah digunakan")
    }

    return true
  }),
  check('email', "Email tidak valid!").isEmail(),
  check("noHp", "Nomor Hp tidak valid!").isMobilePhone("id-ID")
], (req, res) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    // return res.status(400).json({err: err.array()})
    res.render("add-contact", {
      title: "Halaman tambah kontak",
      layout: "layout/mainLayout",
      errors: err.array()
    })
  } else {
    Contact.insertMany(req.body, (err, result) => {
      req.flash('msg', 'Data berhasil ditambahkan')
      res.redirect("/contact")
    })
  }
})

// Hapus kontak
app.delete('/contact', (req, res) => {
  Contact.deleteOne({
    nama: req.body.nama
  }).then((result) => {
    req.flash('msg', 'Kontak berhasil dihapus')
    res.redirect('/contact')
  })
})

// Detail kontak
app.get('/contact/:nama', async (req, res) => {
  const contact = await Contact.findOne({
    nama: req.params.nama
  })

  res.render('detail', {
    layout: "layout/mainLayout",
    title: "Halaman detail kontak",
    contact
  })
})

app.get('/contact/edit/:nama', async (req, res) => {
  const contact = await Contact.findOne({
    nama: req.params.nama
  })

  res.render('edit-contact', {
    layout: "layout/mainLayout",
    title: "Halaman edit kontak",
    contact
  })
})

// Proses update kontat
app.put('/contact', [
  body('nama').custom(async (value, {
    req
  }) => {
    const duplikat = await Contact.findOne({
      nama: value
    })
    if (value !== req.body.oldName && duplikat) {
      throw new Error("Nama sudah digunakan")
    }

    return true
  }),
  check('email', "Email tidak valid!").isEmail(),
  check("noHp", "Nomor Hp tidak valid!").isMobilePhone("id-ID")
], (req, res) => {
  const err = validationResult(req)
  if (!err.isEmpty()) {
    res.render("edit-contact", {
      title: "Halaman edit kontak",
      layout: "layout/mainLayout",
      errors: err.array(),
      contact: req.body
    })
  } else {
    Contact.updateOne({
      _id: req.body._id
    }, {
      $set: {
        nama: req.body.nama,
        noHp: req.body.noHp,
        email: req.body.email
      }
    }).then((result) => {
      req.flash('msg', 'Data berhasil diedit')
      res.redirect("/contact")
    })
  }
})