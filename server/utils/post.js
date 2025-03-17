async function getPublishedPosts(filter = {}, limit = 10, page = 1) {
    const perPage = limit;
    return await Post.find({
      ...filter,
      isVisible: true,
      status: 'published'
    })
    .sort({ createdAt: -1 })
    .skip(perPage * (page - 1))
    .limit(perPage)
    .populate('author', 'username')
    .populate('category', 'name');
  }
  