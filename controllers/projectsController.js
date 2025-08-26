const { CuratedProject, CraftedProject } = require("../models/projectsModel");

function getModelByType(type) {
  return type === "crafted" ? CraftedProject : CuratedProject;
}

function validateType(type) {
  return ["crafted", "curated"].includes(type);
}

// Get all projects
exports.getAllProjects = async (req, res) => {
  const { projectTitle, status, techStack, contributorName, contributorId, type } = req.query;

  if (!validateType(type)) {
    return res.status(400).json({ errorMessage: "Invalid project type" });
  }

  try {
    let query = {
      isDeleted: false,
      $or: [
        { status: "approved" },
        {
          status: { $in: ["pending", "rejected"] },
          contributorId: contributorId ? Number(contributorId) : null,
        },
      ],
    };

    const andFilters = [];

    if (projectTitle) {
      andFilters.push({
        projectTitle: { $regex: projectTitle, $options: "i" },
      });
    }

    if (status) {
      andFilters.push({
        status: { $regex: status, $options: "i" },
      });
    }

    if (techStack) {
      andFilters.push({
        techStack: { $regex: techStack, $options: "i" },
      });
    }

    if (contributorName) {
      andFilters.push({
        contributorName: { $regex: contributorName, $options: "i" },
      });
    }

    if (andFilters.length) {
      query.$and = andFilters;
    }

    const ProjectModel = getModelByType(type);
    const allprojects = await ProjectModel.find(query).sort({ updatedAt: -1 });

    res.status(200).json(allprojects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ errorMessage: "Failed to fetch projects" });
  }
};

// Add a new project
exports.addProject = async (req, res) => {
  const { type } = req.query;

  if (!validateType(type)) {
    return res.status(400).json({ errorMessage: "Invalid project type" });
  }

  try {
    const {
      projectTitle,
      projectDescription,
      githubCodeUrl,
      liveUrl,
      contributorName,
      contributorAvatarUrl,
      contributorGithubUrl,
      contributorRole,
      contributorId,
      techStack,
    } = req.body;

    if (
      !projectTitle ||
      !projectDescription ||
      !githubCodeUrl ||
      !liveUrl ||
      !contributorName ||
      !contributorAvatarUrl ||
      !contributorGithubUrl ||
      !contributorRole ||
      !contributorId
    ) {
      return res.status(400).json({ errorMessage: "Missing required fields" });
    }

    const stack = Array.isArray(techStack)
      ? [...new Set(techStack.map((item) => item.trim()))].slice(0, 4)
      : [];

    const ProjectModel = getModelByType(type);

    const newProject = new ProjectModel({
      projectTitle,
      projectDescription,
      githubCodeUrl,
      liveUrl,
      contributorName,
      contributorId,
      contributorAvatarUrl,
      contributorGithubUrl,
      contributorRole,
      techStack: stack,
      submittedAt: new Date(),
    });

    const addedProject = await newProject.save();

    res.status(201).json({ message: "Project submitted successfully", addedProject });
  } catch (err) {
    console.error("Error submitting project:", err);
    res.status(500).json({ errorMessage: "Failed to submit project" });
  }
};

// Delete a project by ID
exports.deleteProject = async (req, res) => {
  const { id } = req.params;
  const { contributorName, contributorId, userRole } = req.body;
  const { type } = req.query;

  if (!validateType(type)) {
    return res.status(400).json({ errorMessage: "Invalid project type" });
  }

  try {
    const ProjectModel = getModelByType(type);
    const project = await ProjectModel.findById(id);

    if (!project) {
      return res.status(404).json({ errorMessage: "Project not found" });
    }

    const isContributor = project.contributorId === Number(contributorId);
    const isAdmin = userRole === "admin";

    if (!isContributor && !isAdmin) {
      return res.status(403).json({ errorMessage: "Unauthorized to delete this project" });
    }

    if (isAdmin) {
      await ProjectModel.findByIdAndDelete(id);
      return res.status(200).json({ message: "Project permanently deleted by admin" });
    } else {
      project.isDeleted = true;
      project.deletedAt = new Date();
      project.deletedBy = contributorName;
      project.deletedByRole = userRole;

      await project.save();
      return res.status(200).json({ message: "Project deleted successfully" });
    }
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ errorMessage: "Failed to delete project" });
  }
};

// Update a project by ID
exports.updateProject = async (req, res) => {
  const { id } = req.params;

  const {
    projectTitle,
    projectDescription,
    githubCodeUrl,
    liveUrl,
    contributorName,
    contributorAvatarUrl,
    contributorGithubUrl,
    contributorRole,
    contributorId,
    techStack,
    updatedBy,
    updatedByRole,
  } = req.body;

  const { type } = req.query;

  if (!validateType(type)) {
    return res.status(400).json({ errorMessage: "Invalid project type" });
  }

  try {
    const ProjectModel = getModelByType(type);
    const existingProject = await ProjectModel.findById(id);

    if (!existingProject) {
      return res.status(404).json({ errorMessage: "Project not found" });
    }

    if (existingProject.contributorId !== Number(contributorId)) {
      return res.status(403).json({ errorMessage: "Unauthorized to update this project" });
    }

    const stack = Array.isArray(techStack)
      ? [...new Set(techStack.map((item) => item.trim()))]
      : [];

    existingProject.projectTitle = projectTitle ?? existingProject.projectTitle;
    existingProject.projectDescription = projectDescription ?? existingProject.projectDescription;
    existingProject.githubCodeUrl = githubCodeUrl ?? existingProject.githubCodeUrl;
    existingProject.liveUrl = liveUrl ?? existingProject.liveUrl;
    existingProject.contributorName = contributorName ?? existingProject.contributorName;
    existingProject.contributorAvatarUrl =
      contributorAvatarUrl ?? existingProject.contributorAvatarUrl;
    existingProject.contributorGithubUrl =
      contributorGithubUrl ?? existingProject.contributorGithubUrl;
    existingProject.contributorRole = contributorRole ?? existingProject.contributorRole;
    existingProject.techStack = stack.length ? stack : existingProject.techStack;
    existingProject.updatedBy = updatedBy || "Unknown";
    existingProject.updatedByRole = updatedByRole || "contributor";
    existingProject.updatedAt = new Date();
    existingProject.status = "pending";

    const projectAfterUpdate = await existingProject.save();

    res.status(200).json({ message: "Project updated successfully", projectAfterUpdate });
  } catch (err) {
    console.error("Error updating project:", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ errorMessage: messages.join(", ") });
    }

    res.status(500).json({ errorMessage: "Failed to update project" });
  }
};

// Review a project by ID
exports.reviewProject = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const { type } = req.query;
  const { userName, userRole } = req.user;

  if (!validateType(type)) {
    return res.status(400).json({ errorMessage: "Invalid project type" });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ errorMessage: "Invalid status value" });
  }

  if (status === "rejected" && !rejectionReason) {
    return res
      .status(400)
      .json({ errorMessage: "Rejection reason is required when status is rejected" });
  }

  if (!userName || !userRole) {
    return res.status(401).json({ errorMessage: "Unauthorized: missing user context" });
  }

  if (userRole !== "admin") {
    return res.status(403).json({ errorMessage: "Only admins can review projects" });
  }

  try {
    const ProjectModel = getModelByType(type);
    const project = await ProjectModel.findById(id);

    if (!project) {
      return res.status(404).json({ errorMessage: "Project not found" });
    }

    project.status = status;
    project.reviewedBy = userName;
    project.reviewedByRole = userRole;
    project.reviewedAt = new Date();
    project.rejectionReason = status === "rejected" ? rejectionReason : null;

    const projectAfterReview = await project.save();
    res.status(200).json({ message: "Project reviewed successfully", projectAfterReview });
  } catch (err) {
    console.error("Error reviewing project:", err);
    res.status(500).json({ errorMessage: "Failed to review project" });
  }
};
