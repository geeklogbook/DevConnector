const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User')

// @route   GET api/users
// @desc    Test route
// @access  Public
router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', "Please include a valid email").isEmail(),
        check('password', "Please enter a password with 6 or more characters").isLength({ min: 6 })
    ],async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        return res.status(400).json( { errors: errors.array() } );
    }

    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

      const avatar = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
    });
   
        user = new User({
            name,
            email,
            avatar,
            password
        })

        const salt = await bcrypt.genSalt(10); // Ensure this generates a valid salt
        if (typeof password !== 'string') {
            return res.status(400).json({ errors: [{ msg: 'Invalid password format' }] });
        }
        user.password = await bcrypt.hash(password, salt); // Ensure password is a string
        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        }
        
        jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 3600}, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err){
        console.error(err.message);
        res.status(500).send('Server error');
    }
}); 
    


module.exports = router;