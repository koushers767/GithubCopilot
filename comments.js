// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

// Create web server
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create comments object
const commentsByPostId = {};

// Handle event from event bus
app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  // If comment is created
  if (type === 'CommentCreated') {
    const { id, content, postId, status } = data;

    // Create new comment
    const comments = commentsByPostId[postId] || [];
    comments.push({ id, content, status });

    // Save comment
    commentsByPostId[postId] = comments;

    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentModerated',
      data: { id, content, postId, status },
    });
  }

  // If comment is moderated
  if (type === 'CommentModerated') {
    const { id, content, postId, status } = data;

    // Get comments by post id
    const comments = commentsByPostId[postId];

    // Find comment by id
    const comment = comments.find((comment) => {
      return comment.id === id;
    });

    // Update comment status
    comment.status = status;

    // Send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { id, content, postId, status },
    });
  }

  // Send response
  res.send({});
});

// Get comments by post id
app.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const comments = commentsByPostId[id] || [];

  // Send response
  res.send(comments);
});

// Handle event from event bus
app.post('/events', (req, res) => {
  console.log('Received event:', req.body.type);
  res.send({});
});

// Start server
app.listen(4001, () => {
  console.log('Listening on port 4001');
});
