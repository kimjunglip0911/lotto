import urllib.request
import urllib.parse
import json

API_KEY = 'sk_live_skillsmp_GWWurXsy5DKonODfvt7o89DY1aBHrMTWxXowQoNZBGg'
BASE_URL = 'https://skillsmp.com/api/v1/skills/ai-search'

# 10,000 이상 Stars를 찾기 위해 범용적이고 넓은 키워드로 검색
queries = [
    'software engineering design',
    'project planning',
    'coding standards best practices',
    'react nextjs frontend architecture',
    'fullstack development system design',
    'code review documentation',
    'agent developer workflow',
    'technical specification',
    'git workflow guidelines',
]

all_skills = {}

for q in queries:
    url = f"{BASE_URL}?q={urllib.parse.quote(q)}"
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {API_KEY}',
            'User-Agent': 'Mozilla/5.0'
        }
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read())
        items = data.get('data', {}).get('data', [])
        
        for item in items:
            skill = item.get('skill', {})
            if not skill:
                continue
            sid = skill.get('id', '')
            stars = skill.get('stars', 0)
            if sid and sid not in all_skills:
                all_skills[sid] = {
                    'name': skill.get('name', ''),
                    'author': skill.get('author', ''),
                    'description': skill.get('description', ''),
                    'stars': stars,
                    'url': skill.get('skillUrl', ''),
                    'github': skill.get('githubUrl', ''),
                }
    except Exception as e:
        print(f"[ERROR] Query '{q}': {e}")

# stars 기준 내림차순 정렬
sorted_skills = sorted(all_skills.values(), key=lambda x: x['stars'], reverse=True)

# 10,000 (10k) 이상의 stars를 가진 스킬 필터링
top_tier_skills = [s for s in sorted_skills if s['stars'] >= 10000]

print(f"\n{'='*70}")
print(f"  전체 광범위 검색 중 10,000(10k) Stars 이상 스킬 (총 {len(top_tier_skills)}개)")
print(f"{'='*70}\n")

if not top_tier_skills:
    print("현재 조건으로 10,000 Stars 이상의 스킬이 없습니다.")
    print("\n참고용: 검색된 가장 높은 Stars Top 5:")
    for i, s in enumerate(sorted_skills[:5], 1):
        print(f"[{i}] {s['name']} (by {s['author']}) ⭐ {s['stars']}")
else:
    for i, s in enumerate(top_tier_skills, 1):
        print(f"[{i}] {s['name']} (by {s['author']}) ⭐ {s['stars']}")
        print(f"    설명: {s['description'][:150]}")
        print(f"    URL: {s['url']}")
        print()

with open('result_top_stars.json', 'w', encoding='utf-8') as f:
    json.dump({'top_tier': top_tier_skills, 'top_5_overall': sorted_skills[:5]}, f, indent=2, ensure_ascii=False)
