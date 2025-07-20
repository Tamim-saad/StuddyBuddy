import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Quiz as QuizIcon,
  StickyNote2 as StickyNoteIcon
} from '@mui/icons-material';

const SuggestedTasks = ({ suggestions, onCreateFromSuggestion }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz':
        return <QuizIcon className="text-blue-600" />;
      case 'stickynotes':
        return <StickyNoteIcon className="text-orange-600" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'quiz':
        return 'primary';
      case 'stickynotes':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card className="mb-4">
        <CardContent>
          <Typography variant="h6" className="mb-3 font-semibold">
            Suggested Tasks
          </Typography>
          <Typography variant="body2" className="text-gray-500 text-center py-4">
            Create some quizzes or sticky notes to get personalized task suggestions!
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent>
        <Typography variant="h6" className="mb-3 font-semibold">
          Suggested Tasks
        </Typography>
        <Typography variant="body2" className="text-gray-600 mb-3">
          Based on your saved content
        </Typography>
        
        <List className="p-0">
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <ListItem
              key={index}
              className={`border rounded mb-2 ${index === suggestions.length - 1 ? 'mb-0' : ''}`}
              style={{ padding: '8px 12px' }}
            >
              <Box className="flex items-start gap-2 mr-2">
                {getTypeIcon(suggestion.suggestion_type)}
              </Box>
              
              <ListItemText
                primary={
                  <Typography variant="subtitle2" className="font-medium">
                    {suggestion.suggested_title}
                  </Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" className="text-gray-600">
                      {suggestion.suggested_description}
                    </Typography>
                    <Box className="mt-1">
                      <Chip
                        label={suggestion.task_type}
                        size="small"
                        color={getTypeColor(suggestion.suggestion_type)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => onCreateFromSuggestion(suggestion)}
                  className="text-blue-600"
                  title="Create task from suggestion"
                >
                  <AddIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        
        {suggestions.length > 5 && (
          <Typography variant="caption" className="text-gray-500 text-center block mt-2">
            +{suggestions.length - 5} more suggestions available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedTasks; 