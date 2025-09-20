import React, { useState } from 'react';
import { Box, Button, Modal, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/material/styles';

const StyledModal = styled(Modal)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const LightboxContent = styled(Box)`
  background: #fff;
  border-radius: 16px;
  max-width: 90vw;
  max-height: 90vh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 15px;
  right: 15px;
  background: #FF7F1A;
  color: #fff;
  width: 40px;
  height: 40px;
  z-index: 10001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: rgba(178, 2, 2, 0.924);
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    width: 35px;
    height: 35px;
    z-index: 10002;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border: 2px solid #fff;
  }
  
  @media (max-width: 360px) {
    top: 5px;
    right: 5px;
    width: 32px;
    height: 32px;
    z-index: 10003;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    border: 2px solid #fff;
  }
`;

const ImageContainer = styled(Box)`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  min-height: 400px;
  overflow: hidden;
  
  @media (max-width: 480px) {
    min-height: 300px;
  }
`;

const LightboxImage = styled('img')`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0;
`;

const InfoSection = styled(Box)`
  padding: 25px;
  text-align: center;
  background: #1b1b1b;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  color: #fff;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const mockGraphics = [
  {
    id: 1,
    title: "Design Graphique Moderne",
    category: "Branding",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop"
  },
  {
    id: 2,
    title: "Logo Corporate",
    category: "Logo Design", 
    image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=800&h=600&fit=crop"
  },
  {
    id: 3,
    title: "Affiche Publicitaire",
    category: "Print Design",
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop"
  }
];

export default function LightboxFixDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGraphic, setSelectedGraphic] = useState(mockGraphics[0]);

  const openLightbox = (graphic: typeof mockGraphics[0]) => {
    setSelectedGraphic(graphic);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
  };

  return (
    <Box sx={{ p: 4, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', color: '#0380C2' }}>
        Lightbox & News Cards Demo
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: '#666' }}>
        Cliquez sur une image pour tester la lightbox. Les cards n'ont plus de border-radius au hover.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 3,
        maxWidth: 800,
        margin: '0 auto'
      }}>
        {mockGraphics.map((graphic) => (
          <Box
            key={graphic.id}
            sx={{
              cursor: 'pointer',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
            onClick={() => openLightbox(graphic)}
          >
            <img 
              src={graphic.image} 
              alt={graphic.title}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: 0
              }}
            />
            <Box sx={{ p: 2, backgroundColor: 'white' }}>
              <Typography variant="h6" sx={{ fontSize: '1rem', mb: 1 }}>
                {graphic.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {graphic.category}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <StyledModal
        open={isOpen}
        onClose={closeLightbox}
      >
        <LightboxContent onClick={(e) => e.stopPropagation()}>
          <CloseButton onClick={closeLightbox}>
            <CloseIcon />
          </CloseButton>

          <ImageContainer>
            <LightboxImage 
              src={selectedGraphic.image} 
              alt={selectedGraphic.title}
            />
          </ImageContainer>

          <InfoSection>
            <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
              {selectedGraphic.title}
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                background: '#0380C2',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {selectedGraphic.category}
            </Box>
          </InfoSection>
        </LightboxContent>
      </StyledModal>
    </Box>
  );
}