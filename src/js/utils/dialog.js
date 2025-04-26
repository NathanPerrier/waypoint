export function displayDialog(app, router, title, description, redirectPath) {
  app.dialog.create({
    title: title,
    text: description,
    buttons: [
      {
        text: 'OK',
        onClick: function () {
          router.navigate(redirectPath);
        },
      },
    ],
  }).open();
}