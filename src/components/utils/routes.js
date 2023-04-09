import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "../pages/home";
import CreateProjectForm from "../pages/createProject";
import UserProfile from "../pages/profile";
import ProjectPage from "../pages/projectPage";
import { createProject } from "../../utils/projectActions";

export default function Links() {
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/home" element={<Home/>} />
      <Route path="create-project" element={<CreateProjectForm createProject={createProject}/>} />
      <Route path="profile" element={<UserProfile/>} />
      <Route path="/projects/:pid" element={<ProjectPage/>}/>
    </Routes>
  );
}
