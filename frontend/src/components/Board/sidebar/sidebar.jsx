import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
} from "@mui/material";

import{
  LayoutDashboard,
  FileUp,
  FileQuestion,
  StickyNote,
  CalendarDays,
  MessageCircle,
  User,
  Bell,
  FilePenLine,
  Eye,
  ChevronUp,
  ChevronDown, 
  LogOutIcon
} from "lucide-react";

import { amber } from "@mui/material/colors";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const [openQuiz, setOpenQuiz] = useState(false);
  const [openSticky, setOpenSticky] = useState(false);


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
      icon: <LayoutDashboard size={24} color="#fffbeb" />,
      route: "dashboards",
    },
    {
      text: "Uploads",
      icon: <FileUp size={24} color="#fffbeb" />,
      route: "uploads",
    },
    {
      text: "Quizz",
      icon: <FileQuestion size={24} color="#fffbeb" />,
      route: "quiz",
      hasSubmenu: true,
      submenu: [
        {
          text: "Generate Quiz",
          icon: <FilePenLine size={24} color="#fffbeb" />,
          route: "view-files",
        },
        {
          text: "View Quiz",
          icon: <Eye size={24} color="#fffbeb" />,
          route: "saved-quiz",
        },
      ],
    },
    {
      text: "Sticky Notes",
      icon: <StickyNote size={24} color="#fffbeb" />,
      route: "stickynotes",
      hasSubmenu: true,
      submenu: [
        {
          text: "Generate Notes",
          icon: <FilePenLine size={24} color="#fffbeb" />,
          route: "file-list",
        },
        {
          text: "View Notes",
          icon: <Eye size={24} color="#fffbeb" />,
          route: "saved-notes", 
        },
      ],
    },
    {
      text: "Planner",
      icon: <CalendarDays size={24} color="#fffbeb" />,
      route: "planner",
    },
    {
      text: "Forum",
      icon: <MessageCircle size={24} color="#fffbeb" />,
      route: "forum",
    },
    {
      text: "Feedback",
      icon: <FilePenLine size={24} color="#fffbeb" />, // Changed to FilePenLine for feedback
      route: "feedback",
    },
    {
      text: "My Profile",
      icon: <User size={24} color="#fffbeb" />,
      route: "profile",
    },
    {
      text: "Notifications",
      icon: <Bell size={24} color="#fffbeb" />,
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
    (item) => item.text === "My Profile" || item.text === "Notifications" || item.text === "Feedback" 
  );

  const topItems = menuItems.filter(
    (item) =>
      item.text !== "My Profile" &&
      item.text !== "Notifications" &&
      item.text !== "Feedback" &&
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
                        <ChevronUp sx={{ color: amber[50] }} />
                      ) : (
                        <ChevronDown sx={{ color: amber[50] }} />
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
                  <LogOutIcon  />
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
