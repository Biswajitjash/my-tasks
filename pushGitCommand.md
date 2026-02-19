echo "# my-tasks" >> README.md
git init
git add README.md
git remote add origin https://github.com/Biswajitjash/my-tasks.git

git branch -M main

git add .
git commit -m "first commit"
git status
git push -u origin main


…or push an existing repository from the command line
git remote add origin https://github.com/Biswajitjash/my-tasks.git

git branch -M main

git add .
git commit -m "first commit"
git push -u origin main
