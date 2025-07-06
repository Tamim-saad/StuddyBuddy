import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { LoginForm, SignupForm } from "../components/auth";
import AppBar from "../components/appbar/AppBar";
import Sidebar from "../components/Board/sidebar/sidebar";
import { Dashboard } from "../components/project/Dashboard";
import { UserProfile } from "../components/auth/UserProfile";
import propTypes from "prop-types";
import { FileUpload } from "../components/file/FileUpload";
import { FileView } from "../components/quizz/FileView";
import { MCQDisplay } from "../components/quizz/MCQDisplay";
import { CQDisplay } from '../components/quizz/CQDisplay';
import { FileLists } from "../components/stickynotes/FileLists";
import { StickynotesDisplay } from "../components/stickynotes/StickynotesDisplay";
import { SavedStickynotes } from "../components/stickynotes/SavedStickynotes";
import { SavedQuiz } from "../components/quizz/SavedQuiz";
import { Feedback } from "../components/feedback/Feedback";


const Layout = () => {
  return (
    <div className="flex">
      <Sidebar />
      <Outlet />
      {/* This is where the nested route (ProjectCreate) will render */}
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppBar />,
    children: [],
  },
  {
    path: "/signup",
    element: <SignupForm />,
  },
  {
    path: "/login",
    element: <LoginForm />,
  },
  {
    path: "/home",
    element: <Layout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "uploads",
        element: <FileUpload />,
      },
      {
        path: "view-files",
        element: <FileView />,
      },
      {
        path: "quiz",
        children: [
          {
            path: "mcq-display",
            element: <MCQDisplay />,
          },
          {
            path: "cq-display",
            element: <CQDisplay />,
          },

        ],
      },
      {
        path: "file-list",
        element: <FileLists />,
      },
      {
        path: "stickynotes",
        element: <StickynotesDisplay />,
      },
      {
        path: "saved-notes",
        element: <SavedStickynotes />,
      },
      {
        path: "saved-quiz",
        element: <SavedQuiz />,
      },
      {
        path: "feedback",
        element: <Feedback />,
      }
    ],
  },
]);
export const AppRouter = ({ children }) => {
  return <RouterProvider router={router}>{children}</RouterProvider>;
};
AppRouter.propTypes = {
  children: propTypes.node,
};
