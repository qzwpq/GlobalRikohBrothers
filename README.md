# GlobalRikohBrothers

## これはなに
実況用クライアント[グローバル理工兄弟](http://titech-ssr.blog.jp/archives/1010471361.html)のWeb版です  
Meteorにより動いています  
[ここ](http://globalrikohbrothers.meteor.com)で動作の確認をすることができます

## ローカルで動かす方法
[Meteorをインストール](https://www.meteor.com)  
TwitterのConsumer KeyおよびConsumer Secretをあらかじめ[取得](https://apps.twitter.com)しておく  
Callback URLには`http://127.0.0.1:3000/_oauth/twitter?close`を指定しておいてください
### OS X or Linux
```shell
git clone https://github.com/qzwpq/GlobalRikohBrothers.git ~/globalrikohbrothers
cd ~/globalrikohbrothers/private
cp config.json.sample config.json
```
ここで事前に取得しておいたConsumer KeyとConsumer Secretを`config.json`に書き込んでください
```shell
vim config.json
cd ..
```
以上の準備が整ったら`meteor`コマンドで起動してください
```shell
meteor
```
初回起動時には依存パッケージが自動的にダウンロードされます  
`=> App running at: http://localhost:3000/`と表示されたらブラウザでそのアドレスにアクセスしてください  
OS Xでは起動確認をとっていません
### Windows
なんとかして上と同じ手順を踏んでください  
起動確認はとっていません

## License
The MIT license
