import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderIcon from "@mui/icons-material/Folder";
import QuizIcon from "@mui/icons-material/Quiz";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import EventNoteIcon from "@mui/icons-material/EventNote";
import ForumIcon from "@mui/icons-material/Forum";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CreateIcon from "@mui/icons-material/Create";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { amber } from "@mui/material/colors";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isProjectModalOpen, setisProjectModalOpen] = useState(false);
  const [openQuiz, setOpenQuiz] = useState(false);
  const [openSticky, setOpenSticky] = useState(false);

  const handleCloseProjectModal = () => {
    setisProjectModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleQuizClick = () => {
    setOpenQuiz(!openQuiz);
  };

  const handleStickyClick = () => {
    setOpenSticky(!openSticky);
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "dashboards",
    },
    {
      text: "Uploads",
      icon: <AssignmentIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "uploads",
    },
    {
      text: "Chotha",
      icon: <FolderIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "chotha",
    },
    {
      text: "Quizz",
      icon: <QuizIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "quiz",
      hasSubmenu: true,
      submenu: [
        {
          text: "Generate Quiz",
          icon: <CreateIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
          //route: "quiz/generate",
          route: "view-files",
        },
        {
          text: "View Quiz",
          icon: <VisibilityIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
          route: "saved-quiz",
        },
      ],
    },
    {
      text: "Sticky Notes",
      icon: <StickyNote2Icon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "stickynotes",
      hasSubmenu: true,
      submenu: [
        {
          text: "Generate Notes",
          icon: <CreateIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
          route: "file-list",
        },
        {
          text: "View Notes",
          icon: <VisibilityIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
          route: "saved-notes", 
        },
      ],
    },
    {
      text: "Planner",
      icon: <EventNoteIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "planner",
    },
    {
      text: "Forum",
      icon: <ForumIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "forum",
    },
    {
      text: "My Profile",
      icon: <AccountCircleIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "profile",
    },
    {
      text: "Notifications",
      icon: <NotificationsIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />,
      route: "notifications",
    },
  ];

  const handleListItemClick = (route) => {
    if (route === "notifications") {
      navigate(`/project/${route}`);
    } else {
      navigate(`/home/${route}`);
    }
  };

  // Separate bottom items for convenience
  const bottomItems = menuItems.filter(
    (item) => item.text === "My Profile" || item.text === "Notifications"
  );

  const topItems = menuItems.filter(
    (item) =>
      item.text !== "My Profile" &&
      item.text !== "Notifications" &&
      item.text !== "Logout"
  );

  return (
    <>
      <Drawer
        variant="permanent"
        className="w-24"
        sx={{
          "& .MuiDrawer-paper": {
            width: "200px", 
            background: "linear-gradient(180deg, #22c55e 0%, #3b82f6 100%)",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div className="flex flex-col h-screen bg-purple text-white">
          {/* Header + Top menu */}
          <div>
            <h1 className="text-3xl font-bold mb-6 p-4">Studdy Buddy</h1>
            <List>
              {topItems.map((item) => (
                <React.Fragment key={item.text}>
                  <ListItem
                    className="rounded-md hover:bg-green-800 flex items-center justify-center cursor-pointer"
                    sx={{ minHeight: "40px" }}
                    onClick={() => {
                      if (item.hasSubmenu) {
                        if (item.text === "Quizz") {
                          handleQuizClick();
                        } else if (item.text === "Sticky Notes") {
                          handleStickyClick();
                        }
                      } else {
                        handleListItemClick(item.route);
                      }
                    }}
                  >
                    <ListItemIcon
                      className="text-white-900 flex items-center justify-center"
                      sx={{ minWidth: "40px" }}
                    >
                      {React.cloneElement(item.icon, {
                        sx: { fontSize: "1.5rem", color: amber[50] },
                      })}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      className="text-white text-base"
                    />
                    {item.hasSubmenu && (
                      (item.text === "Quizz" ? openQuiz : openSticky) ? (
                        <ExpandLess sx={{ color: amber[50] }} />
                      ) : (
                        <ExpandMore sx={{ color: amber[50] }} />
                      )
                    )}
                  </ListItem>

                  {item.hasSubmenu && (
                    <Collapse 
                      in={item.text === "Quizz" ? openQuiz : openSticky} 
                      timeout="auto" 
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        {item.submenu.map((subItem) => (
                          <ListItem
                            key={subItem.text}
                            className="rounded-md hover:bg-green-800 flex items-center justify-center cursor-pointer"
                            sx={{ pl: 4, minHeight: "40px" }}
                            onClick={() => handleListItemClick(subItem.route)}
                          >
                            <ListItemIcon
                              className="text-white-900 flex items-center justify-center"
                              sx={{ minWidth: "40px" }}
                            >
                              {React.cloneElement(subItem.icon, {
                                sx: { fontSize: "1.5rem", color: amber[50] },
                              })}
                            </ListItemIcon>
                            <ListItemText
                              primary={subItem.text}
                              className="text-white text-base"
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </List>
          </div>

          {/* Spacer pushes bottom items down */}
          <div className="flex-grow" />

          {/* Bottom items with a small gap */}
          <div className="mb-6">
            <List>
              {bottomItems.map((item) => (
                <ListItem
                  key={item.text}
                  className="rounded-md hover:bg-green-800 flex items-center justify-center cursor-pointer"
                  sx={{ minHeight: "40px" }}
                  onClick={() => handleListItemClick(item.route)}
                >
                  <ListItemIcon
                    className="text-white-900 flex items-center justify-center"
                    sx={{ minWidth: "40px" }}
                  >
                    {React.cloneElement(item.icon, {
                      sx: { fontSize: "1.5rem", color: amber[50] },
                    })}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    className="text-white text-base"
                  />
                </ListItem>
              ))}

              {/* Logout at the very bottom */}
              <ListItem
                className="rounded-md hover:bg-gray-800 flex items-center justify-center cursor-pointer"
                sx={{ minHeight: "40px", mt: 2 }}
                onClick={handleLogout}
              >
                <ListItemIcon
                  className="text-white-900 flex items-center justify-center"
                  sx={{ minWidth: "40px" }}
                >
                  <LogoutIcon sx={{ fontSize: "1.5rem", color: amber[50] }} />
                </ListItemIcon>
                <ListItemText primary="Logout" className="text-white text-base" />
              </ListItem>
            </List>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default Sidebar;
