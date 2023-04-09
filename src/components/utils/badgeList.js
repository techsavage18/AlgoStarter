import React from 'react';
import { Badge } from 'react-bootstrap';

export const BadgeList = ({project}) => {

    const date = Date.now() / 1000

    return (
        <div>
          {(project.startDate < date && project.endDate > date)? <Badge bg="secondary" className='me-1'>In Progress</Badge>: <></>}
          {(project.startDate > date)? <Badge bg="secondary" className='me-1'>Starting Soon</Badge>: <></>}
          {(project.endDate < date)? <Badge bg="secondary" className='me-1'>Ended</Badge>: <></>}
          {(project.current_amount >= project.goal)? <Badge bg="success" className='me-1'>Successful</Badge>: <></>}
          {(project.current_amount < project.goal && project.endDate < date)? <Badge bg="warning" text="dark" className='me-1'>Failed</Badge>: <></>}
          {(project.claimed)? <Badge bg="info" className='me-1'>Funds Claimed</Badge>: <></>}
          {(project.deleted)? <Badge bg="danger" className='me-1'>Deleted</Badge>: <></>}
        </div>
      );
}