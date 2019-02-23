const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Idea = mongoose.model('ideas');
const User = mongoose.model('users');
const { ensureAuthenticated, ensureGuest } = require('../helpers/auth');

// ideas Index
router.get('/', (req, res) => {
  Idea.find({ status: 'public' })
    .populate('user')
    .sort({ date: 'desc' })
    .then(ideas => {
      res.render('ideas/index', {
        ideas: ideas
      });
    });
});

// Show Single Idea
router.get('/show/:id', (req, res) => {
  Idea.findOne({
    _id: req.params.id
  })
    .populate('user')
    .populate('comments.commentUser')
    .then(idea => {
      if (idea.status == 'public') {
        res.render('ideas/show', {
          idea: idea
        });
      } else {
        if (req.user) {
          if (req.user.id == idea.user._id) {
            res.render('ideas/show', {
              idea: idea
            });
          } else {
            res.redirect('/ideas');
          }
        } else {
          res.redirect('/ideas');
        }
      }
    });
});

// List ideas from a user
router.get('/user/:userId', (req, res) => {
  Idea.find({ user: req.params.userId, status: 'public' })
    .populate('user')
    .then(ideas => {
      res.render('ideas/index', {
        ideas: ideas
      });
    });
});

// Logged in users ideas
router.get('/my', ensureAuthenticated, (req, res) => {
  Idea.find({ user: req.user.id })
    .populate('user')
    .then(ideas => {
      res.render('ideas/index', {
        ideas: ideas
      });
    });
});

// Add Idea Form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('ideas/add');
});

// Edit Idea Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    if (idea.user != req.user.id) {
      res.redirect('/ideas');
    } else {
      res.render('ideas/edit', {
        idea: idea
      });
    }
  });
});

// Process Add Idea
router.post('/', (req, res) => {
  let allowComments;

  if (req.body.allowComments) {
    allowComments = true;
  } else {
    allowComments = false;
  }

  const newIdea = {
    title: req.body.title,
    body: req.body.body,
    status: req.body.status,
    allowComments: allowComments,
    user: req.user.id
  };

  // Create Idea
  new Idea(newIdea).save().then(idea => {
    res.redirect(`/ideas/show/${idea.id}`);
  });
});

// Edit Form Process
router.put('/:id', (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    let allowComments;

    if (req.body.allowComments) {
      allowComments = true;
    } else {
      allowComments = false;
    }

    // New values
    idea.title = req.body.title;
    idea.body = req.body.body;
    idea.status = req.body.status;
    idea.allowComments = allowComments;

    idea.save().then(idea => {
      res.redirect('/dashboard');
    });
  });
});

// Delete Idea
router.delete('/:id', (req, res) => {
  Idea.remove({ _id: req.params.id }).then(() => {
    res.redirect('/dashboard');
  });
});

// Add Comment
router.post('/comment/:id', (req, res) => {
  Idea.findOne({
    _id: req.params.id
  }).then(idea => {
    const newComment = {
      commentBody: req.body.commentBody,
      commentUser: req.user.id
    };

    // Add to comments array
    idea.comments.unshift(newComment);

    idea.save().then(idea => {
      res.redirect(`/ideas/show/${idea.id}`);
    });
  });
});

module.exports = router;
