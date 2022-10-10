export const NavBar = () => {
  return (
    <div className="bg-primary bg-navbar-img">
      <div className="flex h-20 place-content-between">
        <p className="flex w-72 items-center justify-center text-5xl">HOME</p>
        <div className="flex w-72 gap-x-6 bg-secondary ">
          <img
            src="/Kizaru.png"
            alt="CurrentUserProfileImage"
            className="m-3 h-14 w-14"
          />
          <div className="flex flex-1 items-center text-2xl">totaisei</div>
        </div>
      </div>
    </div>
  );
};
