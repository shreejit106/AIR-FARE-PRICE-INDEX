import collections.abc
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

def update_pptx():
    prs = Presentation('SIH2026-IDEA-Presentation-Format (1).pptx')
    
    # Check number of slides
    print(f"Total slides in template: {len(prs.slides)}")
    
    # Save a populated copy
    prs.save('SIH2026_APIx_Populated_Presentation.pptx')
    print("Saved SIH2026_APIx_Populated_Presentation.pptx")

if __name__ == '__main__':
    update_pptx()
