import { Carousel } from "react-bootstrap";
import "../clampText.css"
import imgProd from '../assets/img/tree_lights.jpg'
import { microalgosToAlgos } from "algosdk";


export function SponsoredProjectsCarousel({projectList, ...props}){
  const numProjects = projectList.length;
  if (numProjects === 0) {
    return (<></>)
  } 
  return (
    <div>
      <h3 className="text-center font-title text-light" style={{fontSize: "40px"}}><b>Featured projects</b></h3>
    <Carousel style={{ height: 500, width:'90%'}} variant="light" className="mx-auto shadow-5-strong">
    {projectList.map((project, index) =>(
        <Carousel.Item style={{ height: 500}} key={index}>
            <img
              className="d-block w-100 h-100"
              src={project.image.length > 0 ? project.image: imgProd}
              alt="First slide"
              style={{ objectFit: "cover"}}
            />
            <Carousel.Caption className="d-block">
              <h3>{project.name}</h3>
              <p>Goal: {microalgosToAlgos(project.goal)} ALGO </p>
              <p className="max-lines">{project.description}</p> 
            </Carousel.Caption>
            </Carousel.Item>
    ))}
    </Carousel>
    </div>)
}
