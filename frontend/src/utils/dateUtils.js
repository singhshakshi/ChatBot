import { format } from 'date-fns';

export const formatDate = (dateString) => {
    return format(new Date(dateString), 'h:mm a');
};

export const formatFullDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
};
