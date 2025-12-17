// src/comments/comments.controller.ts
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
import { CommentsService } from './comments.service';
import { CommentQueryDto } from './dtos/comment-query.dto';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('posts/:postId/comments')
  create(
    @CurrentUser() user: any,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user.sub, postId, dto);
  }

  @Get('posts/:postId/comments')
  getComments(
    @Param('postId') postId: string,
    @Query() query: CommentQueryDto,
  ) {
    return this.commentsService.getCommentsCursor(
      postId,
      query.cursor,
      query.limit,
    );
  }

  @Patch('comments/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(id, user.sub, dto);
  }

  @Delete('comments/:id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.commentsService.deleteComment(id, user.sub);
  }
}
