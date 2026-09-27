import mongoose, { Schema } from 'mongoose'

const MessageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { _id: false })// _id: false --> prevents Mongoose from adding its own _id to each subdocument. Since these messages are always
// nested inside a Project. They don't need their own id.

const PlannedFileSchema = new Schema({
  path: { type: String, required: true },
  description: { type: String, required: true },
  exports: { type: String, default: "" },      // optional, from plan schema
  imports: { type: [String], default: [] },    // optional
}, { _id: false }) 

const ProjectSchema = new Schema({
  name: { type: String, required: true, default: "Untitled Project" },
  description: { type: String, default: "" },
  files: { type: Schema.Types.Mixed, default: {} },
  messages: { type: [MessageSchema], default: [] },
  version: { type: Number, default: 0 },
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  published: { type: Boolean, default: false },
  publishedAt: { type: Date, default: null },                    //  new
  status: {
    type: String,
    enum: ["pending", "generating", "revising", "completed", "failed"],
    default: "pending",
  },
  filesPlanned: { type: [PlannedFileSchema], default: [] },
  filesGenerated: { type: [String], default: [] },
  currentFile: { type: String, default: null },
  error: { type: String, default: null },                        //  new
}, { timestamps: true })


//speeds up specific queries. Without these, Mongo scans the whole collection on each query.
ProjectSchema.index({ owner: 1, updatedAt: -1 }) //Mongo matches queries that filter by owner and sort the same direction.Fast.            
ProjectSchema.index({ published: 1 })//single-field index for getPublicProject, which filters by published: true.

export const Project = mongoose.model('Project', ProjectSchema)