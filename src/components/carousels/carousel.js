import Image from 'next/image';

const AquaCarousel = () => {
  return (
    <div className="carousel carousel-center bg-neutral rounded-box max-w-md space-x-4 p-4">
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500} // specify the desired width
          height={300} // specify the desired height
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
      <div className="carousel-item">
        <Image
          src="https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.jpg"
          alt="A beautiful scene"
          className="rounded-box"
          width={500}
          height={300}
        />
      </div>
    </div>
  );
};

export default AquaCarousel;