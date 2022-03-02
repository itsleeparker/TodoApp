//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

//connect to database
mongoose.connect(
  'mongodb+srv://itsleeparker:IloveAnime1@cluster0.hsb2p.mongodb.net/todolistDb',
  {
    useNewUrlParser: true,
  },
);

const itemsSchema = {
  name: String,
};

const userListSchema = {
  name: String,
  items: [itemsSchema], //basicaly this table will be relate to the main table where each row will have a list name and another coloum will have list item
};

const Item = mongoose.model('Item', itemsSchema); //declare the Item Schema
const List = mongoose.model('list', userListSchema);

//create three data items
const item1 = new Item({
  name: '<----Hit this to delete',
});

const item2 = new Item({
  name: 'Hit This + to add ----->',
});

let defaultList = [item1, item2];

app.get('/', function(req, res) {
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultList, err => {
        if (err) {
          console.log(err);
        } else {
          console.log('Data inseterted in database sucessfully');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {listTitle: 'Today', newListItems: items});
    }
  });
});

app.post('/', function(req, res) {
  const itemName = req.body.newItem;
  const listName = _.capitalize(req.body.list);
  const listItem = new Item({
    name: itemName,
  });

  //check which page sent the data
  if ('Today' == listName) {
    listItem.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(listItem);
      foundList.save();
    });
    res.redirect('/' + listName);
  }
});

app.post('/delete', (req, res) => {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if ('Today' == listName) {
    Item.deleteOne({_id: checkedItem}, err => {
      if (err) {
        throw err;
      }
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItem}}}, //this will look for given query in given field and remove it
      err => {
        if (!err) {
          res.redirect('/' + listName);
        }
      },
    );
  }
});

app.get('/:title', (req, res) => {
  const title = req.params.title;
  List.findOne({name: title}, (err, list) => {
    if (!err) {
      if (!list) {
        //check if that list already exisist or not
        const d_list = new List({
          name: title,
          items: defaultList,
        });
        d_list.save();
        res.redirect('/' + title);
      } else {
        res.render('list', {listTitle: title, newListItems: list.items});
      }
    }
  });
});

app.get('/about', function(req, res) {
  res.render('about');
});

let port = process.env.PORT;
if (port == null || port == '') {
  port = 3000;
}

app.listen(port, () => {
  console.log('Server Online');
});
