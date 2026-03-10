import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Attendance from "./pages/Attendance";
import Analytics from "./pages/Analytics";
import AddProject from "./pages/AddProject";
import EditProject from "./pages/EditProject";
import Contractors from "./pages/Contractors";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Dashboard,
  },
  {
    path: "/projects",
    Component: Projects,
  },
  {
    path: "/project/:id",
    Component: ProjectDetails,
  },
  {
    path: "/attendance",
    Component: Attendance,
  },
  {
    path: "/analytics",
    Component: Analytics,
  },
  {
    path: "/add-project",
    Component: AddProject,
  },
  {
    path: "/edit-project/:id",
    Component: EditProject,
  },
  {
    path: "/contractors",
    Component: Contractors,
  },
]);
