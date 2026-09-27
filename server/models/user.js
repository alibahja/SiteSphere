//Defines a schema: the shape of the user document in mongodb
//hashes the password automatically before saving
//Add instance method: compare password for login
// creates a model which we query with

import mongoose, { Schema } from 'mongoose'  // Schema is a class used to define document structure
import bcrypt from 'bcrypt' //passowrd hashing library

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,   
    trim: true,
  },
  password: { type: String, required: true },
}, { timestamps: true }) // timestamps: true --> automatically adds createdAt and updatedAT fieds to every document

UserSchema.pre('save', async function () {  // pre('save') is a middleware hook that runs before any .save() operation on a document
  if (!this.isModified('password')) return; //this.isModified(): returns true if the password field has been changed since it was last 
  // loaded from the DB (or since document creation)

  const salt = await bcrypt.genSalt(10) //Generates a random salt with 10 rounds of work factor
 //The salt is random data added to the password before hashing, so two users with the same password get different hashes.
 // This prevents rainbow-table attacks.

  this.password = await bcrypt.hash(this.password, salt) //Takes the raw password, prepends the salt, hashes it
})

UserSchema.methods.comparePassword = async function (password) {
  //takes the plain password (from the login form), hashes it with the same salt embedded in the stored hash, and compares.
  return bcrypt.compare(password, this.password)
}

export const User = mongoose.model('User', UserSchema)