import sys
sys.path.insert(0, 'career_aid_pro')
from cv_builder import render_cv_html

data = {
    'full_name': 'John Doe',
    'target_role': 'Engineer',
    'email': 'john@example.com',
    'phone': '123',
    'location': 'Accra',
    'linkedin': '',
    'professional_summary': 'Dev',
    'skills': 'Python',
    'experience': [],
    'education': []
}

templates = [
    'sidebar',
    'twocolumn',
    'timeline',
    'minimalist',
    'infographic',
    'centered',
    'boxed',
    'dark',
    'classic',
    'executive',
    'atelier',
    'metro',
    'editorial',
    'compact',
    'accentbar',
    'portfolio',
    'consultant',
    'graduate',
    'tech',
]

for t in templates:
    html = render_cv_html(data, template=t)
    if 'grid-template-columns' in html:
        layout = 'GRID'
    elif 'cv-sidebar' in html:
        layout = 'SIDEBAR'
    elif 'cv-page::before' in html:
        layout = 'TIMELINE'
    elif '#0a0a0a' in html:
        layout = 'DARK'
    elif 'border: 2px solid' in html:
        layout = 'BOXED'
    elif 'repeating-linear-gradient' in html:
        layout = 'LINED'
    elif 'columns:' in html:
        layout = 'COLUMN'
    else:
        layout = 'OTHER'
    print(f'{t}: {layout}')
