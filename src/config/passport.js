const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
}, async(req, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const selectedRole = req.query.role || 'athlete'; // Get the selected role from the query parameters

        let user = await User.findUserByEmail(email);

        if (!user) {
            const userRole = await Role.getRoleByName(selectedRole);
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            
            const newUser = await User.createUser(
                email,
                hashedPassword,
                profile.displayName,
                userRole.id
            );
            
            // Получаем полные данные пользователя с role_name
            user = await User.findUserById(newUser.id);
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}))

module.exports = passport;