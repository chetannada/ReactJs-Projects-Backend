const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectTitle: { type: String, required: true },
    projectDescription: { type: String, required: true },
    githubCodeUrl: { type: String, required: true },
    liveUrl: { type: String, required: true },
    contributorName: { type: String, required: true },
    contributorId: { type: Number, required: true },
    contributorAvatarUrl: { type: String, required: true },
    contributorGithubUrl: { type: String, required: true },
    contributorRole: {
      type: String,
      enum: ["admin", "contributor"],
      default: "contributor",
    },
    techStack: {
      type: [String],
      validate: {
        validator: function (arr) {
          const unique = new Set(arr.map((item) => item.trim().toLowerCase()));
          return unique.size === arr.length && arr.length <= 4;
        },
        message: "Tech stack must be unique and not exceed 4 items.",
      },
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    updatedBy: { type: String, default: null },
    updatedByRole: {
      type: String,
      enum: ["admin", "contributor"],
      default: null,
    },
    reviewedBy: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const isProduction = process.env.NODE_ENV === "production";

const collectionName = isProduction ? "craftedprojects_prod" : "craftedprojects_dev";

const Project = mongoose.model("CraftedProjects", projectSchema, collectionName);

module.exports = Project;
