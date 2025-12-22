// src/posts/posts.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePostDto } from './dtos/create-post.dto';
import { FeedQueryDto } from './dtos/feed-query.dto';
import { SharePostDto } from './dtos/share-post.dto';
import { UpdatePostDto } from './dtos/update-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(user.sub, dto);
  }

  @Get('feed')
  feed(@CurrentUser() user: any, @Query() query: FeedQueryDto) {
    return this.postsService.getFeed(user.sub, query.page, query.limit);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.getPost(id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, user.sub, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postsService.deletePost(id, user.sub);
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SharePostDto,
  ) {
    return this.postsService.sharePost(user.sub, id, dto.text);
  }
}
