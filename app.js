const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();

app.use(cors());

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('connected to monggggggggooooooo');
  })
  .catch((error) => {
    console.error('connection error:', error);
  });

  app.use(express.json());
  app.use(cookieParser());

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  ip: { type: String },
});

const User = mongoose.model('User', UserSchema);

const TodoSchema = new mongoose.Schema({
  taskname: { type: String, required: true },
  status: { type: String, enum: ['pending', 'done'], required: true },
  tag: { type: String, enum: ['personal', 'official', 'family'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Todo = mongoose.model('Todo', TodoSchema);


app.get('/',(req,res)=>{
  res.send("Hello BRO")
})

app.post('/signup', async (req, res) => {
    try {
      const { name, email, password, ip } = req.body;
  
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }
  
      const user = await User.create({
        name,
        email,
        password,
        ip,
      });
  
      return res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
      console.error('Error during user registration:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findOne({ email });

      console.log(user)
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      return res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error during user login:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  

const authenticate = (req, res, next) => {
    const userId = req.cookies?.session;
  
    if (!userId) {
      return res.status(401).json({ message: 'unauthorized' });
    }
  
    req.user = userId;
    next();
  };
  
  app.use('/todos', authenticate);

app.post('/todos', async (req, res) => {
  try {
    const { taskname, status, tag } = req.body;

    const todo = await Todo.create({
      taskname,
      status,
      tag,
      user: req.user,
    });

    return res.status(201).json({ message: 'created successfully', todo });
  } catch (error) {
    console.error('Error during todo creation:', error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

app.put('/todos/:todoId', async (req, res) => {
  try {
    const { taskname, status, tag } = req.body;
    const { todoId } = req.params;

    const todo = await Todo.findOne({ _id: todoId, user: req.user });
    if (!todo) {
      return res.status(404).json({ message: 'not found' });
    }

    todo.taskname = taskname;
    todo.status = status;
    todo.tag = tag;
    await todo.save();

    return res.status(200).json({ message: 'updated successfully', todo });
  } catch (error) {
    console.error('Error during todo update:', error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

app.delete('/todos/:todoId', async (req, res) => {
  try {
    const { todoId } = req.params;

    const todo = await Todo.findOne({ _id: todoId, user: req.user });
    if (!todo) {
      return res.status(404).json({ message: 'not found' });
    }

    await todo.remove();

    return res.status(200).json({ message: ' deleted successfully' });
  } catch (error) {
    console.error('Error during todo deletion:', error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

app.get('/todos', async (req, res) => {
  try {
    const { status, tag } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }
    if (tag) {
      query.tag = tag;
    }

    const todos = await Todo.find(query);

    return res.status(200).json({ message: 'retrieved successfully', todos });
  } catch (error) {
    console.error('Error during getting todos:', error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

app.get('/todos/:todoId', async (req, res) => {
  try {
    const { todoId } = req.params;

    const todo = await Todo.findOne({ _id: todoId, user: req.user });
    if (!todo) {
      return res.status(404).json({ message: 'not found' });
    }

    return res.status(200).json({ message: ' retrieved successfully', todo });
  } catch (error) {
    console.error('Error during getting a todo:', error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
