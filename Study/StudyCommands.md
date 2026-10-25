git init //初始化仓库

git status //查看改动状态

git add . //添加全部改动

git add 文件名 //只加指定文件

git commit -m"在这里写提交说明"

git remote add origin 仓库地址 .git //关联远程github仓库

git push origin main //推送到远程

git pull origin main //拉取远程最新代码（把GitHub上的下载覆盖本地）

git clone 仓库地址 .git //克隆别人/自己的仓库到本地

git remote -v //查看远程仓库链接

git remote remove origin //取消关联远程

git log //查看提交记录

git checkout main //切换到主分支

git branch //查看本地有哪些分支

git branch feature/add-score //新建一个叫 feature/add-score 的分支，但不会自动切换过去

git branch -d feature/add-score //删除本地分支。`-d` 是安全删除

git branch -D feature/add-score //强制删除本地分支

git branch -a //查看本地和远程所有分支

git merge //把某个分支的改动合并到当前分支


